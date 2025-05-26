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
interface ExistingProduct {
  productId: string;
  wattage: number;
  qty: number;
}
interface RoomData {
  id: string;
  location: string;
  locationTagId: string | null;
  photos: OnSiteVisitPhoto[];
  suggestedProducts: ProductSelection[];
  existingLights: ExistingProduct[]  // Changed from existingLighting to existingLights to match Prisma
  lightingIssue: string;
  customerRequest: string;
  mountingKitQty: number;
  motionSensorQty: number;
  ceilingHeight: number | null;
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
  
  
  const [existingProducts, setExistingProducts] = useState<{ id: string; name: string; wattage: number }[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<{ id: string; name: string }[]>([]);


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

  const [operationHoursPerDay, setOperationHoursPerDay] = useState<number>(0);
  const [operationDaysPerYear, setOperationDaysPerYear] = useState<number>(0);



  useEffect(() => {
    const fetchInit = async () => {
      try{
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
        ceilingHeight: room.ceilingHeight || null,
        photos: room.photos.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          comment: photo.comment ?? '',
          tags: photo.tags.map((pivot: any) => pivot.tag.id),
        })),
        suggestedProducts: room.suggestedLights.map((light: any) => ({
          productId: light.productId,
          qty: light.quantity,
        })),
        existingLights: room.existingLights.map((light: any) => ({  // Changed from existingProducts to existingLights to match Prisma schema
          productId: light.productId,
          qty: light.quantity,
          wattage: light.product?.wattage || 0,
        })),
      }));
      
      const fetchExistingProducts = async () => {
        const res = await fetch('/api/products/existing');
        const data = await res.json();
        setExistingProducts(data);
      };
      
      const fetchSuggestedProducts = async () => {
        const res = await fetch('/api/fixture-types');
        const data = await res.json();
        setSuggestedProducts(data);
      };
      
      fetchExistingProducts();
      fetchSuggestedProducts();
      
      
      const fetchProducts = async () => {
        const [suggestedRes, existingRes] = await Promise.all([
          fetch('/api/products/suggested'),
          fetch('/api/products/existing'),
        ]);
        const suggested = await suggestedRes.json();
        const existing = await existingRes.json();
      
        setSuggestedProducts(suggested);
        setExistingProducts(existing);
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
      } catch (error){
        console.error('Error fetching onsite visit data:', error);
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
  const updateExistingProductsInDB = async (existingLights: { productId: string; qty: number; wattage: number }[]) => {
    if (!selectedRoom) return;
    
    try {
      await fetch(`/api/onsitevisit/room/${selectedRoom.id}/existingLights`, {  // Changed endpoint to match backend
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingLights }),  // Consistent naming
      });
    } catch (error) {
      console.error('Failed to update existing lighting:', error);
    }
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
          existingLights: [],  // Changed from existingLights to existingLights
          suggestedProducts: [],
          lightingIssue: newRoom.lightingIssue,
          customerRequest: newRoom.customerRequest,
          mountingKitQty: newRoom.mountingKitQty,
          motionSensorQty: newRoom.motionSensorQty,
          ceilingHeight: null,
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
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-white border rounded-lg shadow-md"
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
          <div className="p-4 border-b font-semibold sticky top-0 bg-gray-100 z-10 flex items-center justify-between">
            <span>Rooms</span>
            <button
              className="sm:hidden p-1 rounded hover:bg-gray-200"
              aria-label="Close Sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {rooms.map((room, index) => {
              const tagName = locationTags.find((tag) => tag.id === room.locationTagId)?.name;
              const displayName = tagName ? `Room ${index + 1} - (${tagName})` : `Room ${index + 1}`;
              return (
                <div
                  key={room.id}
                  className={`flex items-center justify-between px-2 py-2 mx-2 my-1 rounded hover:bg-gray-200 ${
                    room.id === selectedRoomId ? 'bg-blue-100 border border-blue-300' : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setSidebarOpen(false);
                    }}
                    className="flex-1 text-left focus:outline-none px-2 py-1"
                  >
                    {displayName}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label={`Delete ${displayName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
          
          <button
            onClick={addRoom}
            className="bg-blue-500 text-white px-4 py-2 m-2 rounded hover:bg-blue-600 transition-colors"
          >
            + Add Room
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {!selectedRoom ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">🏠</div>
                <div className="text-xl">Select a room to get started</div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name ??
                    `Room ${rooms.findIndex((r) => r.id === selectedRoomId) + 1}`}
                </h2>
                <div className="h-1 w-20 bg-blue-500 rounded"></div>
              </div>

              {/* Form Layout */}
              <div className="space-y-6">
                {/* Location Section */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 mb-4">📍 Location Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location:</label>
                      <input
                        type="text"
                        value={selectedRoom.location}
                        onChange={(e) => updateRoomAndPersist({ location: e.target.value })}
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Tag:</label>
                      <select
                        value={selectedRoom.locationTagId || ''}
                        onChange={async (e) => {
                          const newTagId = e.target.value || null;
                          try {
                            await axios.put(`/api/onsitevisit/room/${selectedRoom.id}/location-tag`, {
                              locationTagId: newTagId,
                            });
                            updateRoom({ locationTagId: newTagId });
                          } catch (err) {
                            alert(err.response?.data?.error || 'Failed to update location tag');
                          }
                        }}
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">None</option>
                        {locationTags.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="New Location Tag"
                      value={newLocationTag}
                      onChange={(e) => setNewLocationTag(e.target.value)}
                      className="flex-1 border rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          await axios.put(`/api/onsitevisit/room/${selectedRoom.id}/location-tag`, {
                            locationTagId: createdTag.id,
                          });
                          updateRoom({ locationTagId: createdTag.id });
                          setNewLocationTag('');
                        } catch (err) {
                          alert(err.response?.data?.error || 'Failed to create tag');
                        }
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 mb-4">📷 Photos</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos (multiple):</label>
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
                      className="w-full border rounded p-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {isUploading && (
                      <div className="mt-2 text-blue-600">Uploading... {uploadProgress}% complete</div>
                    )}
                  </div>

                  {selectedRoom.photos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedRoom.photos.map((photo, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm">
                          <img
                            src={photo.url}
                            alt="preview"
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                          <input
                            type="text"
                            placeholder="Comment"
                            value={photo.comment}
                            onChange={(e) => handleCommentUpdate(idx, e.target.value)}
                            className="w-full border rounded p-2 mb-2 text-sm"
                          />

                          <div className="flex flex-wrap gap-1 mb-2">
                            {photo.tags.map((tagId) => {
                              const tag = photoTags.find((t) => t.id === tagId);
                              return (
                                <span
                                  key={tagId}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs"
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
                            className="w-full border rounded p-1 mb-2 text-sm"
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

                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="New Photo Tag"
                              value={newPhotoTagInput}
                              onChange={(e) => setNewPhotoTagInput(e.target.value)}
                              className="flex-1 border rounded p-1 text-sm"
                            />
                            <button
                              onClick={handleAddPhotoTag}
                              className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Add
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeletePhoto(idx)}
                            className="w-full text-red-600 hover:text-red-800 p-1 text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lighting Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Existing Lighting */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Existing Lighting</h3>
                    {selectedRoom.existingLights.map((prod, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border mb-3">
                        <div className="space-y-2">
                          <select
                            value={prod.productId}
                            onChange={(e) => {
                              const prods = [...selectedRoom.existingLights];
                              prods[idx].productId = e.target.value;
                              updateRoom({ existingLights: prods });
                              updateExistingProductsInDB(prods);
                            }}
                            className="w-full border rounded p-2 text-sm"
                          >
                            <option value="">Select Product</option>
                            {existingProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.wattage}W)
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={prod.qty}
                                onChange={(e) => {
                                  const prods = [...selectedRoom.existingLights];
                                  prods[idx].qty = parseInt(e.target.value) || 1;
                                  updateRoom({ existingLights: prods });
                                  updateExistingProductsInDB(prods);
                                }}
                                className="w-full border rounded p-2 text-sm text-center"
                              />
                            </div>
                            
                          </div>
                          <button
                            onClick={() => {
                              const prods = selectedRoom.existingLights.filter((_, i) => i !== idx);
                              updateRoom({ existingLights: prods });
                              updateExistingProductsInDB(prods);
                            }}
                            className="w-full text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateRoom({
                          existingLights: [
                            ...selectedRoom.existingLights,
                            { productId: '', qty: 1, wattage: 0 },
                          ],
                        })
                      }
                      className="w-full border-2 border-dashed border-orange-300 rounded p-2 text-orange-600 hover:bg-orange-100"
                    >
                      + Add Existing Product
                    </button>
                  </div>

                  {/* Suggested Lighting */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-gray-800 mb-4">Suggested Lighting</h3>
                    {selectedRoom.suggestedProducts.map((prod, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border mb-3">
                        <div className="space-y-2">
                          <select
                            value={prod.productId}
                            onChange={(e) => {
                              const prods = [...selectedRoom.suggestedProducts];
                              prods[idx].productId = e.target.value;
                              updateRoom({ suggestedProducts: prods });
                              updateSuggestedProductsInDB(prods);
                            }}
                            className="w-full border rounded p-2 text-sm"
                          >
                            <option value="">Select Product</option>
                            {suggestedProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <div>
                            <label className="block text-xs text-gray-600">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={prod.qty}
                              onChange={(e) => {
                                const prods = [...selectedRoom.suggestedProducts];
                                const value = e.target.value;
                                prods[idx].qty = value === '' ? '' : parseInt(value) || 1;
                                updateRoom({ suggestedProducts: prods });
                                if (value !== '') {
                                  updateSuggestedProductsInDB(prods);
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                  const prods = [...selectedRoom.suggestedProducts];
                                  prods[idx].qty = 1;
                                  updateRoom({ suggestedProducts: prods });
                                  updateSuggestedProductsInDB(prods);
                                }
                              }}
                              className="w-full border rounded p-2 text-sm text-center"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const prods = selectedRoom.suggestedProducts.filter((_, i) => i !== idx);
                              updateRoom({ suggestedProducts: prods });
                              updateSuggestedProductsInDB(prods);
                            }}
                            className="w-full text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
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
                      className="w-full border-2 border-dashed border-green-300 rounded p-2 text-green-600 hover:bg-green-100"
                    >
                      + Add Suggested Product
                    </button>
                  </div>
                </div>

                {/* Room Details */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-800 mb-4">🏠 Room Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ceiling Height (ft):</label>
                      <input
                        type="number"
                        value={selectedRoom.ceilingHeight || ''}
                        onChange={(e) =>
                          updateRoomAndPersist({ ceilingHeight: parseFloat(e.target.value) || null })
                        }
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Kit Qty:</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedRoom.mountingKitQty}
                        onChange={(e) =>
                          updateRoomAndPersist({ mountingKitQty: parseInt(e.target.value) || 0 })
                        }
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motion Sensor Qty:</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedRoom.motionSensorQty}
                        onChange={(e) =>
                          updateRoomAndPersist({ motionSensorQty: parseInt(e.target.value) || 0 })
                        }
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Existing Lighting Issue:</label>
                      <textarea
                        value={selectedRoom.lightingIssue}
                        onChange={(e) => updateRoomAndPersist({ lightingIssue: e.target.value })}
                        className="w-full border rounded p-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Requirement:</label>
                      <textarea
                        value={selectedRoom.customerRequest}
                        onChange={(e) => updateRoomAndPersist({ customerRequest: e.target.value })}
                        className="w-full border rounded p-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
