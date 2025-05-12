'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface OnSiteVisitPhoto {
  id: string;
  url: string;
  comment: string;
  tags: string[]; // array of tag IDs
}

interface ProductSelection {
  productId: string;
  qty: number;
}

interface RoomData {
  id: string;
  location: string;
  locationTagId: string | null;
  photos: OnSiteVisitPhoto[];
  suggestedProducts: ProductSelection[];
  lightingIssue: string;
  customerRequest: string;
  mountingKitQty: number;
  motionSensorQty: number;
}

const LOCATION_TAGS = [
  { id: 'lt1', name: 'Main Hall' },
  { id: 'lt2', name: 'Storage Area' },
];

const photoTags = [
  { id: 'pt1', name: 'Sky Lift Required' },
  { id: 'pt2', name: 'Ceiling Obstruction' },
];

export default function OnSiteVisitForm({ caseId }: { caseId: string }) {
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const [newLocationTag, setNewLocationTag] = useState('');
  const [newPhotoTags, setNewPhotoTags] = useState<Record<number, string>>({});
  const [photoTags, setPhotoTags] = useState<{ id: string; name: string }[]>([]);
  const [newPhotoTagInput, setNewPhotoTagInput] = useState('');
  const [locationTags, setLocationTags] = useState<{ id: string; name: string }[]>([]);
  // 🚀 Fetch initial OnSiteVisit data (rooms, photos, tags, products)
  useEffect(() => {
    const fetchInit = async () => {
      const res = await axios.get(`/api/onsitevisit/form/init?caseId=${caseId}`);
      const data = res.data;
      console.log('Loaded OnSiteVisit:', data);

      const loadedRooms: RoomData[] = data.rooms.map((room: any) => ({
        id: room.id,
        location: room.location,
        locationTagId: room.locationTagId,
        lightingIssue: room.lightingIssue,
        customerRequest: room.customerRequest,
        mountingKitQty: room.mountingKitQty,
        motionSensorQty: room.motionSensorQty,
        photos: room.photos.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          comment: photo.comment,
          tags: photo.tags.map((pivot: any) => pivot.tag.id), // flatten tag ids
        })),
        suggestedProducts: room.suggestedLights.map((light: any) => ({
          productId: light.productId,
          qty: light.quantity,
        })),
      }));
      const fetchProducts = async () => {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      };
      fetchProducts();
      const loadTags = async () => {
        const res = await fetch(`/api/onsitevisit/photo/tag`);
        const data = await res.json();
        setPhotoTags(data);
      };
      loadTags();
      const fetchLocationTags = async () => {
        const res = await axios.get('/api/onsitevisit/location-tag');
        setLocationTags(res.data);
      };
      fetchLocationTags();
      setRooms(loadedRooms);
      if (loadedRooms.length > 0) {
        setSelectedRoomId(loadedRooms[0].id);
      }
    };

    fetchInit();
  }, [caseId]);
  const handleDeleteRoom = async (roomIdToDelete: string) => {
    if (rooms.length <= 1) {
      alert('At least one room is required.');
      return;
    }

    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await axios.delete(`/api/onsitevisit/room/${roomIdToDelete}`);
      const updatedRooms = rooms.filter((r) => r.id !== roomIdToDelete);
      setRooms(updatedRooms);

      // Select another room (first one by default)
      if (updatedRooms.length > 0) {
        setSelectedRoomId(updatedRooms[0].id);
      }
    } catch (error) {
      console.error('Failed to delete room', error);
      alert('Failed to delete room. Check console for details.');
    }
  };
  const handleAddPhotoTag = async () => {
    if (newPhotoTagInput.trim()) {
      const res = await axios.post('/api/onsitevisit/photo/tag', { name: newPhotoTagInput.trim() });
      setPhotoTags([...photoTags, res.data]);
      setNewPhotoTagInput('');
    }
  };
  const updateRoomAndPersist = (updated: Partial<RoomData>) => {
    if (!selectedRoom) return;

    const updatedRoom = { ...selectedRoom, ...updated };
    setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? updatedRoom : r)));

    axios.put(`/api/onsitevisit/room/${selectedRoom.id}`, updated).catch(console.error);
  };

  const updateSuggestedProductsInDB = async (newProducts: ProductSelection[]) => {
    if (!selectedRoom) return;

    await axios.put(`/api/onsitevisit/${caseId}/room/${selectedRoom.id}/suggestedProducts`, {
      suggestedProducts: newProducts,
    });
  };

  // ✅ Add new room (via API)
  const addRoom = async () => {
    try {
      const res = await axios.post(`/api/onsitevisit/${caseId}/room`, {
        location: '',
        locationTagId: null,
        lightingIssue: '',
        customerRequest: '',
        mountingKitQty: 0,
        motionSensorQty: 0,
      });

      const newRoom = res.data;

      setRooms((prev) => [
        ...prev,
        {
          id: newRoom.id,
          location: newRoom.location,
          locationTagId: newRoom.locationTagId,
          photos: [],
          suggestedProducts: [],
          lightingIssue: newRoom.lightingIssue,
          customerRequest: newRoom.customerRequest,
          mountingKitQty: newRoom.mountingKitQty,
          motionSensorQty: newRoom.motionSensorQty,
        },
      ]);

      setSelectedRoomId(newRoom.id);
    } catch (error) {
      console.error('Failed to add room:', error);
    }
  };

  const updateRoom = (updated: Partial<RoomData>) => {
    setRooms((prev) => prev.map((r) => (r.id === selectedRoomId ? { ...r, ...updated } : r)));
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!selectedRoom) return;
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedPhotos: OnSiteVisitPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', selectedRoom.id);

      try {
        const res = await axios.post(`/api/onsitevisit/${caseId}/photo/upload`, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });

        uploadedPhotos.push({
          id: res.data.id,
          url: res.data.url,
          comment: res.data.comment ?? '',
          tags: [],
        });
      } catch (err) {
        console.error('Upload failed for:', file.name, err);
      }
    }

    updateRoom({ photos: [...selectedRoom.photos, ...uploadedPhotos] });
    setIsUploading(false);
    setUploadProgress(null);
  };

  const handleCommentUpdate = async (photoIndex: number, newComment: string) => {
    if (!selectedRoom) return;
    const photos = [...selectedRoom.photos];
    const photo = photos[photoIndex];
    photos[photoIndex].comment = newComment;
    updateRoom({ photos });

    if (photo.id) {
      await axios.put(`/api/onsitevisit/${caseId}/photo/${photo.id}`, { comment: newComment });
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!selectedRoom) return;
    const photos = [...selectedRoom.photos];
    const photo = photos[photoIndex];

    if (photo.id) {
      await axios.delete(`/api/onsitevisit/photo/${photo.id}`);
    }

    photos.splice(photoIndex, 1);
    updateRoom({ photos });
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      {/* Sidebar Toggle Button for Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="sm:hidden p-2 m-2 border rounded bg-gray-100"
      >
        {sidebarOpen ? 'Close' : 'Menu'}
      </button>

      <div className="flex h-[80vh] border rounded shadow overflow-hidden max-w-full">
        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-gray-100 border-r flex flex-col z-50 transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } sm:static sm:translate-x-0 sm:w-64 sm:min-w-[12rem] sm:max-w-[15rem] overflow-y-auto`}
        >
          <div className="p-4 border-b font-semibold sticky top-0 bg-gray-100 z-10">Rooms 
            <button
                className="sm:hidden p-1 rounded hover:bg-gray-200"
                aria-label="Close Sidebar"
                onClick={() => setSidebarOpen(false)}
            >
                ✕
            </button></div>
          <div className="flex-1 overflow-y-auto">
            {rooms.map((room, index) => {
              const tagName = LOCATION_TAGS.find((tag) => tag.id === room.locationTagId)?.name;
              const displayName = tagName || `Room ${index + 1}`;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setSidebarOpen(false); // auto-close sidebar on mobile
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-200 ${
                    room.id === selectedRoomId ? 'bg-white font-bold' : ''
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
          <button
            onClick={addRoom}
            className="bg-blue-500 text-white px-4 py-2 m-2 rounded hover:bg-blue-600"
          >
            + Add Room
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedRoom ? (
            <div>Select a room</div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">
                {locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name ??
                  `Room ${rooms.findIndex((r) => r.id === selectedRoomId) + 1}`}
              </h2>

              {/* LOCATION */}
              <label className="block mb-2">
                Location:
                <input
                  type="text"
                  value={selectedRoom.location}
                  onChange={(e) => updateRoomAndPersist({ location: e.target.value })}
                  className="border rounded p-1 w-full"
                />
              </label>

              {/* LOCATION TAG */}
              <label className="block mb-4">
                Location Tag:
                <select
                  value={selectedRoom.locationTagId || ''}
                  onChange={async (e) => {
                    const newTagId = e.target.value || null;
                    try {
                      await axios.put(`/api/onsitevisit/room/${selectedRoom.id}/location-tag`, {
                        locationTagId: newTagId,
                      });
                      updateRoom({ locationTagId: newTagId });
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to update location tag');
                    }
                  }}
                  className="border rounded p-1 w-full"
                >
                  <option value="">None</option>
                  {locationTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="New Location Tag"
                  value={newLocationTag}
                  onChange={(e) => setNewLocationTag(e.target.value)}
                  className="border rounded p-1 flex-1"
                />
                <button
                  onClick={async () => {
                    if (!newLocationTag.trim()) return;
                    try {
                      const res = await axios.post('/api/onsitevisit/location-tag', {
                        name: newLocationTag.trim(),
                      });
                      const createdTag = res.data;
                      setLocationTags((prev) => [...prev, createdTag]);

                      // optional auto-select:
                      await axios.put(`/api/onsitevisit/room/${selectedRoom.id}/location-tag`, {
                        locationTagId: createdTag.id,
                      });
                      updateRoom({ locationTagId: createdTag.id });

                      setNewLocationTag('');
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to create tag');
                    }
                  }}
                  className="bg-green-500 text-white px-2 rounded"
                >
                  Add
                </button>
              </div>

              {/* PHOTO UPLOAD */}
              <div className="mb-4">
                <label>Upload Photos (multiple):</label>
                <input
                  type="file"
                  accept="image/*, .heic, .heif"
                  multiple
                  capture="environment"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files) {
                      handlePhotoUpload(Array.from(e.target.files));
                    }
                  }}
                  className="block mt-1 w-full border rounded p-2 disabled:opacity-50"
                />
                {isUploading && (
                  <div className="mt-2 text-blue-500">Uploading... {uploadProgress}% complete</div>
                )}
                {selectedRoom.photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {selectedRoom.photos.map((photo, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <img
                          src={photo.url}
                          alt="preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <input
                          type="text"
                          placeholder="Comment"
                          value={photo.comment}
                          onChange={(e) => handleCommentUpdate(idx, e.target.value)}
                          className="border p-1 rounded w-full mb-1"
                        />

                        <div className="flex flex-wrap gap-2 mb-2">
                          {photo.tags.map((tagId) => {
                            const tag = photoTags.find((t) => t.id === tagId);
                            return (
                              <span
                                key={tagId}
                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs"
                              >
                                {tag?.name}
                                <button
                                  onClick={async () => {
                                    const photos = [...selectedRoom.photos];
                                    const photo = photos[idx];
                                    await axios.delete(
                                      `/api/onsitevisit/photo/${photo.id}/tag/${tagId}`,
                                    );
                                    photo.tags = photo.tags.filter((id) => id !== tagId);
                                    photos[idx] = photo;
                                    updateRoom({ photos });
                                  }}
                                  className="ml-1 text-indigo-500 hover:text-indigo-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <select
                            value=""
                            onChange={async (e) => {
                              const selectedTagId = e.target.value;
                              if (selectedTagId) {
                                const photos = [...selectedRoom.photos];
                                const photo = photos[idx];
                                if (!photo.tags.includes(selectedTagId)) {
                                  await axios.post(`/api/onsitevisit/photo/${photo.id}/tag`, {
                                    tagId: selectedTagId,
                                  });
                                  photo.tags = [...photo.tags, selectedTagId];
                                  photos[idx] = photo;
                                  updateRoom({ photos });
                                }
                              }
                            }}
                            className="border rounded p-1 flex-1"
                          >
                            <option value="">Add Tag...</option>
                            {photoTags
                              .filter((tag) => !photo.tags.includes(tag.id))
                              .map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 w-full">
                          <input
                            type="text"
                            placeholder="New Photo Tag"
                            value={newPhotoTagInput}
                            onChange={(e) => setNewPhotoTagInput(e.target.value)}
                            className="border p-1 rounded w-full mb-1"
                          />
                          <button
                            onClick={handleAddPhotoTag}
                            className="bg-green-500 text-white px-4 py-2 rounded whitespace-nowrap"
                          >
                            Add Tag
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeletePhoto(idx)}
                          className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50 mt-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>{' '}
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Lighting */}
              <div className="mb-4">
                <label className="block font-semibold mb-1">Suggested Lighting:</label>
                {selectedRoom.suggestedProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <select
                      value={prod.productId}
                      onChange={(e) => {
                        const prods = [...selectedRoom.suggestedProducts];
                        prods[idx].productId = e.target.value;
                        updateRoom({ suggestedProducts: prods });
                        updateSuggestedProductsInDB(prods); // sync to DB
                      }}
                      className="border rounded p-1 flex-1"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={prod.qty}
                      onChange={(e) => {
                        const prods = [...selectedRoom.suggestedProducts];
                        prods[idx].qty = parseInt(e.target.value) || 1;
                        updateRoom({ suggestedProducts: prods });
                        updateSuggestedProductsInDB(prods); // sync to DB
                      }}
                      className="border rounded p-1 w-16 text-center"
                    />
                    <button
                      onClick={() => {
                        const prods = selectedRoom.suggestedProducts.filter((_, i) => i !== idx);
                        updateRoom({ suggestedProducts: prods });
                        updateSuggestedProductsInDB(prods); // sync to DB
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    updateRoom({
                      suggestedProducts: [
                        ...selectedRoom.suggestedProducts,
                        { productId: '', qty: 1 },
                      ],
                    })
                  }
                  className="text-blue-500 hover:underline mt-1"
                >
                  + Add Product
                </button>
              </div>

              {/* Other fields */}
              <label className="block mb-2">
                Existing Lighting Issue:
                <textarea
                  value={selectedRoom.lightingIssue}
                  onChange={(e) => updateRoomAndPersist({ lightingIssue: e.target.value })}
                  className="border rounded p-1 w-full"
                  rows={2}
                />
              </label>

              <label className="block mb-2">
                Customer Requirement:
                <textarea
                  value={selectedRoom.customerRequest}
                  onChange={(e) => updateRoomAndPersist({ customerRequest: e.target.value })}
                  className="border rounded p-1 w-full"
                  rows={2}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  Mounting Kit Qty:
                  <input
                    type="number"
                    min="0"
                    value={selectedRoom.mountingKitQty}
                    onChange={(e) =>
                      updateRoomAndPersist({ mountingKitQty: parseInt(e.target.value) || 0 })
                    }
                    className="border rounded p-1 w-full"
                  />
                </label>
                <label className="block">
                  Motion Sensor Qty:
                  <input
                    type="number"
                    min="0"
                    value={selectedRoom.motionSensorQty}
                    onChange={(e) =>
                      updateRoomAndPersist({ motionSensorQty: parseInt(e.target.value) || 0 })
                    }
                    className="border rounded p-1 w-full"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
