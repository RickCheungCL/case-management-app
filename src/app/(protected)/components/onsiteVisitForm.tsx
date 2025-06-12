'use client';

import { useState, useEffect,useCallback } from 'react';
import useSWR,{ mutate } from 'swr';
import axios from 'axios';

interface OnSiteVisitPhoto {
  id: string;
  url: string;
  comment: string;
  tags: string[]; // array of tag IDs
}

interface ProductSelection {
  productId: string;
  description:string;
  qty: number;
}
interface ExistingProduct {
  productId: string;
  wattage: number;
  qty: number;
  bypassBallast:boolean;
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
  mountingKitQty: string;
  motionSensorQty: number;
  ceilingHeight: number | null;
}


const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
const axiosFetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export default function OnSiteVisitForm({ caseId }: { caseId: string }) {
  
  
  


  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newLocationTag, setNewLocationTag] = useState('');
  const [newPhotoTagInput, setNewPhotoTagInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // 🚀 Fetch initial OnSiteVisit data (rooms, photos, tags, products)

  

  

  const { data: onSiteVisitData, error: onSiteError, isLoading: isLoadingOnSite } = useSWR(
    `/api/onsitevisit/form/init?caseId=${caseId}`,
    axiosFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  const { data: existingProducts = [], error: existingError } = useSWR(
    '/api/products/existing',
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: suggestedProducts = [], error: suggestedError } = useSWR(
    '/api/products/suggested',
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: photoTags = [], error: photoTagsError } = useSWR(
    '/api/onsitevisit/photo/tag',
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: locationTags = [], error: locationTagsError } = useSWR(
    '/api/onsitevisit/location-tag',
    axiosFetcher,
    { revalidateOnFocus: false }
  );

  // Process rooms data from SWR
  const rooms: RoomData[] = onSiteVisitData?.rooms?.map((room: any) => ({
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
      tags: (photo.tags || []).map((pivot: any) => ({
        tag_id: pivot.tagId || pivot.tag_id || pivot.tag?.id,
        photo_id: pivot.photoId || pivot.photo_id || photo.id,
        tag: pivot.tag ?? photoTags.find((t: any) => t.id === pivot.tagId),
      })),
    })),
    suggestedProducts: room.suggestedLights.map((light: any) => ({
      productId: light.productId,
      description: light.description,
      qty: light.quantity,
    })),
    existingLights: room.existingLights.map((light: any) => ({
      productId: light.productId,
      qty: light.quantity,
      wattage: light.product?.wattage || 0,
      bypassBallast: light.bypassBallast ?? false,
    })),
  })) || [];

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Set initial selected room when data loads
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // Optimistic update helper
  const optimisticUpdate = useCallback(async (
    key: string,
    updateFn: (data: any) => any,
    apiCall: () => Promise<any>
  ) => {
    try {
      // Optimistically update
      await mutate(key, updateFn, false);
      
      // Make API call
      await apiCall();
      
      // Revalidate to ensure consistency
      mutate(key);
    } catch (error) {
      // Revert on error
      mutate(key);
      console.error('Update failed:', error);
      throw error;
    }
  }, []);

  const handleDeleteRoom = async (roomIdToDelete: string) => {
    if (rooms.length <= 1) {
      alert('At least one room is required.');
      return;
    }

    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await optimisticUpdate(
        `/api/onsitevisit/form/init?caseId=${caseId}`,
        (data) => ({
          ...data,
          rooms: data.rooms.filter((r: any) => r.id !== roomIdToDelete)
        }),
        () => axios.delete(`/api/onsitevisit/room/${roomIdToDelete}`)
      );

      // Update selected room if necessary
      const remainingRooms = rooms.filter((r) => r.id !== roomIdToDelete);
      if (remainingRooms.length > 0 && selectedRoomId === roomIdToDelete) {
        setSelectedRoomId(remainingRooms[0].id);
      }
    } catch (error) {
      console.error('Failed to delete room', error);
      alert('Failed to delete room. Check console for details.');
    }
  };

  const handleAddPhotoTag = async () => {
    if (!newPhotoTagInput.trim()) return;

    try {
      const newTag = await axios.post('/api/onsitevisit/photo/tag', { 
        name: newPhotoTagInput.trim() 
      });
      
      // Update SWR cache
      mutate('/api/onsitevisit/photo/tag', [...photoTags, newTag.data], false);
      setNewPhotoTagInput('');
    } catch (error) {
      console.error('Failed to add photo tag:', error);
    }
  };

  const updateRoomAndPersist = async (updated: Partial<RoomData>) => {
    if (!selectedRoom) return;

    try {
      await optimisticUpdate(
        `/api/onsitevisit/form/init?caseId=${caseId}`,
        (data) => ({
          ...data,
          rooms: data.rooms.map((r: any) => 
            r.id === selectedRoom.id ? { ...r, ...updated } : r
          )
        }),
        () => axios.put(`/api/onsitevisit/room/${selectedRoom.id}`, updated)
      );
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  const updateSuggestedProductsInDB = async (newProducts: ProductSelection[]) => {
    if (!selectedRoom) return;

    try {
      await optimisticUpdate(
        `/api/onsitevisit/form/init?caseId=${caseId}`,
        (data) => ({
          ...data,
          rooms: data.rooms.map((r: any) => 
            r.id === selectedRoom.id 
              ? { ...r, suggestedLights: newProducts.map(p => ({ ...p, quantity: p.qty })) }
              : r
          )
        }),
        () => axios.put(`/api/onsitevisit/${caseId}/room/${selectedRoom.id}/suggestedProducts`, {
          suggestedProducts: newProducts,
        })
      );
    } catch (error) {
      console.error('Failed to update suggested products:', error);
    }
  };

  const updateExistingProductsInDB = async (existingLights: ExistingProduct[]) => {
    if (!selectedRoom) return;

    try {
      await optimisticUpdate(
        `/api/onsitevisit/form/init?caseId=${caseId}`,
        (data) => ({
          ...data,
          rooms: data.rooms.map((r: any) => 
            r.id === selectedRoom.id 
              ? { ...r, existingLights: existingLights.map(l => ({ ...l, quantity: l.qty })) }
              : r
          )
        }),
        () => fetch(`/api/onsitevisit/room/${selectedRoom.id}/existingLights`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ existingLights }),
        })
      );
    } catch (error) {
      console.error('Failed to update existing lighting:', error);
    }
  };

  const addRoom = async () => {
    try {
      const res = await axios.post(`/api/onsitevisit/${caseId}/room`, {
        location: '',
        locationTagId: null,
        lightingIssue: '',
        customerRequest: '',
        mountingKitQty: '',
        motionSensorQty: 0,
      });

      const newRoom = res.data;

      // Update SWR cache optimistically
      await mutate(
        `/api/onsitevisit/form/init?caseId=${caseId}`,
        (data) => ({
          ...data,
          rooms: [...(data?.rooms || []), {
            id: newRoom.id,
            location: newRoom.location,
            locationTagId: newRoom.locationTagId,
            lightingIssue: newRoom.lightingIssue,
            customerRequest: newRoom.customerRequest,
            mountingKitQty: newRoom.mountingKitQty,
            motionSensorQty: newRoom.motionSensorQty,
            ceilingHeight: null,
            photos: [],
            suggestedLights: [],
            existingLights: [],
          }]
        }),
        false
      );

      setSelectedRoomId(newRoom.id);
    } catch (error) {
      console.error('Failed to add room:', error);
      // Revalidate on error
      mutate(`/api/onsitevisit/form/init?caseId=${caseId}`);
    }
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

    // Update SWR cache with new photos
    await mutate(
      `/api/onsitevisit/form/init?caseId=${caseId}`,
      (data) => ({
        ...data,
        rooms: data.rooms.map((r: any) => 
          r.id === selectedRoom.id 
            ? { ...r, photos: [...r.photos, ...uploadedPhotos] }
            : r
        )
      }),
      false
    );

    setIsUploading(false);
    setUploadProgress(null);
  };
  const updateRoom = useCallback(async (updated: Partial<RoomData>) => {
    if (!selectedRoom) return;
  
    await mutate(
      `/api/onsitevisit/form/init?caseId=${caseId}`,
      (data) => ({
        ...data,
        rooms: data.rooms.map((r: any) => 
          r.id === selectedRoom.id ? { ...r, ...updated } : r
        )
      }),
      false
    );
  }, [selectedRoom, caseId]);
  const handleCommentUpdate = async (photoIndex: number, newComment: string) => {
    if (!selectedRoom) return;
    
    const updatedPhotos = [...selectedRoom.photos];
    const photo = updatedPhotos[photoIndex];
    updatedPhotos[photoIndex] = { ...photo, comment: newComment };

    // Optimistic update
    await mutate(
      `/api/onsitevisit/form/init?caseId=${caseId}`,
      (data) => ({
        ...data,
        rooms: data.rooms.map((r: any) => 
          r.id === selectedRoom.id 
            ? { ...r, photos: updatedPhotos }
            : r
        )
      }),
      false
    );

    // API call
    if (photo.id) {
      try {
        await axios.put(`/api/onsitevisit/${caseId}/photo/${photo.id}`, { comment: newComment });
      } catch (error) {
        // Revert on error
        mutate(`/api/onsitevisit/form/init?caseId=${caseId}`);
        console.error('Failed to update comment:', error);
      }
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!selectedRoom) return;
    
    const photo = selectedRoom.photos[photoIndex];
    const updatedPhotos = selectedRoom.photos.filter((_, i) => i !== photoIndex);

    // Optimistic update
    await mutate(
      `/api/onsitevisit/form/init?caseId=${caseId}`,
      (data) => ({
        ...data,
        rooms: data.rooms.map((r: any) => 
          r.id === selectedRoom.id 
            ? { ...r, photos: updatedPhotos }
            : r
        )
      }),
      false
    );

    // API call
    if (photo.id) {
      try {
        await axios.delete(`/api/onsitevisit/photo/${photo.id}`);
      } catch (error) {
        // Revert on error
        mutate(`/api/onsitevisit/form/init?caseId=${caseId}`);
        console.error('Failed to delete photo:', error);
      }
    }
  };

  // Error handling
  if (onSiteError || existingError || suggestedError || photoTagsError || locationTagsError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <div className="text-center">
          <div className="text-xl mb-2">⚠️ Error Loading Data</div>
          <div className="text-sm">Please try refreshing the page</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingOnSite) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading on-site visit data...</div>
        </div>
      </div>
    );
  }

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
              
              const displayName = room.location
                ? tagName
                  ? `${index + 1}) ${room.location} - (${tagName})`
                  : `${index + 1}) ${room.location}`
                : tagName
                  ? `Room ${index + 1} - (${tagName})`
                  : `Room ${index + 1}`;
              
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
                  {selectedRoom.location
                    ? locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name
                      ? `${rooms.findIndex((r) => r.id === selectedRoomId) + 1}) ${selectedRoom.location} - (${locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name})`
                      : `${rooms.findIndex((r) => r.id === selectedRoomId) + 1}) ${selectedRoom.location}`
                    : locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name
                      ? `Room ${rooms.findIndex((r) => r.id === selectedRoomId) + 1} - (${locationTags.find((t) => t.id === selectedRoom.locationTagId)?.name})`
                      : `Room ${rooms.findIndex((r) => r.id === selectedRoomId) + 1}`}
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
                            // Update SWR cache
                            mutate(`/api/onsitevisit/form/init?caseId=${caseId}`);
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

                  {selectedRoom.photos && selectedRoom.photos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedRoom.photos.map((photo, idx) => {
                        if (!photo || !photo.id) {
                          console.warn('Skipping invalid photo at index:', idx);
                          return null;
                        }
                        
                        return (
                          <div key={`${photo.id}-${idx}`} className="bg-white border rounded-lg p-3 shadow-sm">
                            <img
                              src={photo.url}
                              alt="preview"
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                            <input
                              type="text"
                              placeholder="Comment"
                              value={photo.comment || ''}
                              onChange={(e) => handleCommentUpdate(idx, e.target.value)}
                              className="w-full border rounded p-2 mb-2 text-sm"
                            />

                            <div className="flex flex-wrap gap-1 mb-2">
                            {(photo.tags || []).map((pivot) => {
                              const tag = pivot?.tag;

                              if (!tag || !tag.id || !tag.name) {
                                console.warn("⚠️ Skipping invalid tag pivot:", pivot);
                                return null;
                              }

                              return (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs"
                                >
                                  {tag.name}
                                  <button
                                    onClick={async () => {
                                      const updatedPhotos = [...selectedRoom.photos];
                                      const photoToUpdate = updatedPhotos[idx];

                                      if (!photoToUpdate) return;

                                      // Optimistically remove tag pivot
                                      photoToUpdate.tags = (photoToUpdate.tags || []).filter(
                                        (t) => t.tag?.id !== tag.id
                                      );
                                      updatedPhotos[idx] = { ...photoToUpdate };

                                      updateRoom({ photos: updatedPhotos });

                                      try {
                                        await axios.delete(`/api/onsitevisit/photo/${photo.id}/tag/${tag.id}`);
                                      } catch (err) {
                                        console.error("Failed to delete tag:", err);
                                      }
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
                                if (!selectedTagId || !photo || !photo.id) return;
                                
                                try {
                                  const updatedPhotos = [...selectedRoom.photos];
                                  const photoToUpdate = updatedPhotos[idx];

                                  // Check if tag already exists (using the correct pivot structure)
                                  const tagExists = (photoToUpdate.tags || []).some(
                                    (pivot) => pivot?.tag?.id === selectedTagId
                                  );

                                  if (!tagExists) {
                                    // Find the full tag object
                                    const selectedTag = photoTags.find(tag => tag.id === selectedTagId);
                                    if (!selectedTag) return;

                                    // Create the proper pivot structure to match your display code
                                    const newTagPivot = {
                                      tag: {
                                        id: selectedTag.id,
                                        name: selectedTag.name
                                      },
                                      photo_id: photo.id,
                                      tag_id: selectedTag.id
                                    };

                                    updatedPhotos[idx] = {
                                      ...photoToUpdate,
                                      tags: [...(photoToUpdate.tags || []), newTagPivot], // Add pivot, not just ID
                                    };

                                    await mutate(
                                      `/api/onsitevisit/form/init?caseId=${caseId}`,
                                      (data) => {
                                        if (!data || !data.rooms) return data;
                                        return {
                                          ...data,
                                          rooms: data.rooms.map((r: any) =>
                                            r?.id === selectedRoom.id ? { ...r, photos: updatedPhotos } : r
                                          ),
                                        };
                                      },
                                      false
                                    );

                                    await axios.post(`/api/onsitevisit/photo/${photo.id}/tag`, {
                                      tagId: selectedTagId,
                                    });
                                  }
                                } catch (error) {
                                  console.error('Failed to add tag:', error);
                                  // Revert on error
                                  mutate(`/api/onsitevisit/form/init?caseId=${caseId}`);
                                }
                              }}
                              className="w-full border rounded p-1 mb-2 text-sm"
                            >
                              <option value="">Add Tag...</option>
                              {photoTags
                                .filter((tag): tag is { id: string; name: string } =>
                                  tag && typeof tag.id === "string" && typeof tag.name === "string"
                                )
                                .filter((tag) =>
                                  (photo.tags || []).every((pivot) => pivot?.tag?.id !== tag.id)
                                )
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
                        );
                      }).filter(Boolean)}
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
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={prod.qty}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string and numbers during typing
                                  if (value === '' || /^\d*$/.test(value)) {
                                    const prods = [...selectedRoom.existingLights];
                                    prods[idx].qty = value === '' ? '' : parseInt(value) || 1;
                                    updateRoom({ existingLights: prods });
                                  }
                                }}
                                onBlur={(e) => {
                                  // Convert to number on blur and apply min value of 1
                                  const numValue = parseInt(e.target.value) || 1;
                                  const finalValue = Math.max(1, numValue);
                                  const prods = [...selectedRoom.existingLights];
                                  prods[idx].qty = finalValue;
                                  updateRoom({ existingLights: prods });
                                  updateExistingProductsInDB(prods);
                                }}
                                className="w-full border rounded p-2 text-sm text-center"
                              />
                            </div>
                            
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Ballast</label>
                            <select
                              value={prod.bypassBallast ? 'Yes' : 'No'}
                              onChange={(e) => {
                                const prods = [...selectedRoom.existingLights];
                                prods[idx].bypassBallast = e.target.value === 'Yes';
                                updateRoom({ existingLights: prods });
                                updateExistingProductsInDB(prods);
                              }}
                              className="w-full border rounded p-2 text-sm text-center"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
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
            
            // Find the selected product to get its description
            const selectedProduct = suggestedProducts.find(p => p.id === e.target.value);
            if (selectedProduct) {
              prods[idx].description = selectedProduct.description || '';
            }
            
            updateRoom({ suggestedProducts: prods });
            updateSuggestedProductsInDB(prods);
          }}
          className="w-full border rounded p-2 text-sm"
        >
          <option value="">Select Product</option>
          {/* Group products by description (category) */}
          {Object.entries(
            suggestedProducts.reduce((groups, product) => {
              // Use the description field as category, handle null descriptions
              const category = product.description || 'Uncategorized';
              if (!groups[category]) {
                groups[category] = [];
              }
              groups[category].push(product);
              return groups;
            }, {})
          )
          .sort(([a], [b]) => {
            // Custom sorting: SuperPanel and SuperStrip first, then alphabetical
            const priorityOrder = ['SuperPanel', 'SuperStrip','LED_Panel'];
            
            const aIsPriority = priorityOrder.includes(a);
            const bIsPriority = priorityOrder.includes(b);
            
            // If both are priority categories, sort by their order in the priority array
            if (aIsPriority && bIsPriority) {
              return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
            }
            
            // If only 'a' is priority, it comes first
            if (aIsPriority && !bIsPriority) {
              return -1;
            }
            
            // If only 'b' is priority, it comes first  
            if (!aIsPriority && bIsPriority) {
              return 1;
            }
            
            // Neither are priority, sort alphabetically
            return a.localeCompare(b);
          })
          .map(([category, products]) => (
            <optgroup key={category} label={category.replace(/_/g, ' ')}>
              {products
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort products within category
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
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
          { productId: '', description: '', qty: 1 },
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ceiling Height (FT):</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Accessory:</label>
                      <textarea
                        value={selectedRoom.mountingKitQty}
                        onChange={(e) =>
                          updateRoomAndPersist({ mountingKitQty: e.target.value })
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
