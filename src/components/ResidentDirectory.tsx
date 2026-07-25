import React, { useState } from 'react';
import { Resident, UserRole } from '../types/society';
import { formatDateTime, parseISOToLocalDate } from '../utils/dateFormatter';
import { 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  Users, 
  Phone, 
  Compass,
  Smartphone,
  Home,
  Clock
} from 'lucide-react';

interface ResidentDirectoryProps {
  residents: Resident[];
  onAddResident: (resident: Omit<Resident, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  onUpdateResident: (residentId: string, updates: Omit<Resident, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  onDeleteResident: (residentId: string) => void;
  currentRole: UserRole;
}

export const ResidentDirectory: React.FC<ResidentDirectoryProps> = ({
  residents,
  onAddResident,
  onUpdateResident,
  onDeleteResident,
  currentRole,
}) => {
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<string | null>(null);
  
  // Modals / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [flatNumber, setFlatNumber] = useState('');
  const [roomType, setRoomType] = useState<'1BHK' | '2BHK'>('2BHK');

  const [searchQuery, setSearchQuery] = useState('');

  // 22 floors descending (22 to 1)
  const floors = Array.from({ length: 22 }, (_, i) => 22 - i);

  // Get residents for a specific floor
  const getResidentsOnFloor = (floorNum: number) => {
    return residents.filter(r => {
      const floorOfFlat = Math.floor(Number(r.flatNumber) / 100);
      return floorOfFlat === floorNum;
    });
  };

  // Get flats for active floor (always 7 units: X01 to X07)
  const getFlatsForFloor = (floorNum: number) => {
    return Array.from({ length: 7 }, (_, i) => `${floorNum}${String(i + 1).padStart(2, '0')}`);
  };

  const handleOpenAddModal = (flatNum: string) => {
    setFlatNumber(flatNum);
    setName('');
    setMobile('');
    setAge('');
    setSex('Male');
    // Default room type based on existing residents in the flat, or default to 2BHK
    const flatRes = residents.filter(r => r.flatNumber === flatNum);
    if (flatRes.length > 0) {
      setRoomType(flatRes[0].roomType);
    } else {
      setRoomType('2BHK');
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (res: Resident) => {
    setEditingResident(res);
    setName(res.name);
    setMobile(res.mobile);
    setAge(String(res.age));
    setSex(res.sex);
    setFlatNumber(res.flatNumber);
    setRoomType(res.roomType);
    setShowEditModal(true);
  };

  const handleCreateResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !age || !flatNumber) return;

    onAddResident({
      name,
      mobile,
      age: Number(age),
      sex,
      flatNumber,
      roomType,
    });

    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident || !name || !mobile || !age || !flatNumber) return;

    onUpdateResident(editingResident.id, {
      name,
      mobile,
      age: Number(age),
      sex,
      flatNumber,
      roomType,
    });

    setShowEditModal(false);
    setEditingResident(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resident from the matrix?')) {
      onDeleteResident(id);
    }
  };

  // Search filter
  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.flatNumber.includes(searchQuery) ||
    r.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-400" />
            Vaishnavi Pride Resident Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            22 floors, 154 units. Manage and browse residents, contact profiles, and room type directories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name, Flat, or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-sky-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      {searchQuery ? (
        /* Search Results View */
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              Search Results ({filteredResidents.length} found)
            </h3>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              Clear Search
            </button>
          </div>

          {filteredResidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No matching residents found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResidents.map(res => (
                <div key={res.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
                        Flat #{res.flatNumber} • {res.roomType}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{res.name}</h4>
                    </div>
                    {currentRole === 'Management' && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(res)}
                          className="p-1 hover:bg-slate-800 rounded text-sky-400"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="p-1 hover:bg-slate-800 rounded text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{res.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{res.sex}, {res.age} yrs</span>
                    </div>

                    {/* Audit Metadata Trail */}
                    <div className="col-span-2 pt-2 border-t border-slate-900/50 flex flex-col gap-1 text-[9px] text-slate-500 font-mono">
                      <div className="flex justify-between">
                        <span>Added: {res.createdAt ? formatDateTime(res.createdAt) : 'N/A'}</span>
                        <span>By: {res.createdBy}</span>
                      </div>
                      {res.updatedAt && (
                        <div className="flex justify-between text-sky-400/80 border-t border-slate-900/30 pt-0.5 mt-0.5">
                          <span>Edited: {formatDateTime(res.updatedAt)}</span>
                          <span>By: {res.updatedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeFloor === null ? (
        /* 1) 22 Floor Interactive Animated Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {floors.map(floorNum => {
            const floorResidents = getResidentsOnFloor(floorNum);
            const residentCount = floorResidents.length;

            return (
              <button
                key={floorNum}
                onClick={() => setActiveFloor(floorNum)}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/80 hover:border-sky-500/50 hover:from-slate-900 hover:to-slate-950 text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5"
              >
                {/* Glowing hover accent */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl font-extrabold text-white group-hover:text-sky-400 transition-colors">
                      {floorNum}F
                    </span>
                    <span className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-sky-300 group-hover:border-sky-500/20 transition-all">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Floor {floorNum}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">7 Flats ({floorNum}01 - {floorNum}07 series)</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {residentCount} {residentCount === 1 ? 'Resident' : 'Residents'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* 2) Floor Flat Grid & Resident Details */
        <div className="space-y-6">
          {/* Back button and floor selector */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveFloor(null);
                setSelectedFlat(null);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              Back to 22 Floors
            </button>
            <h3 className="text-sm font-bold text-slate-400">
              Viewing Floor {activeFloor}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flat cards list (7 units per floor) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Home className="w-4 h-4 text-sky-400" />
                  Flat units on Floor {activeFloor} (7 units total)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {getFlatsForFloor(activeFloor).map(flatNum => {
                    const flatResidents = residents.filter(r => r.flatNumber === flatNum);
                    const count = flatResidents.length;
                    const isSelected = selectedFlat === flatNum;
                    const flatRoomType = flatResidents.length > 0 ? flatResidents[0].roomType : '2BHK'; // pre-fill room type

                    return (
                      <button
                        key={flatNum}
                        onClick={() => setSelectedFlat(flatNum)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                          isSelected
                            ? 'bg-sky-600/20 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-black text-white text-base">#{flatNum}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase bg-slate-900 border border-slate-800 text-slate-400">
                            {flatRoomType}
                          </span>
                        </div>

                        <div className="mt-4">
                          <span className="text-[10px] text-slate-500 block">Total Residents</span>
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-sky-400" />
                            {count} {count === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3) & 4) Flat Family/Resident Details view */}
            <div className="space-y-4">
              {selectedFlat ? (
                (() => {
                  const flatResidents = residents.filter(r => r.flatNumber === selectedFlat);
                  const flatRoomType = flatResidents.length > 0 ? flatResidents[0].roomType : '2BHK';

                  return (
                    <div className="glass-panel p-5 space-y-4 relative">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-base font-extrabold text-white">Flat #{selectedFlat} Directory</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Room Type: {flatRoomType}</p>
                        </div>
                        {currentRole === 'Management' && (
                          <button
                            onClick={() => handleOpenAddModal(selectedFlat)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Member
                          </button>
                        )}
                      </div>

                      {flatResidents.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">
                          No residents registered for Flat #{selectedFlat}.
                          {currentRole === 'Management' && (
                            <button
                              onClick={() => handleOpenAddModal(selectedFlat)}
                              className="mt-3 block mx-auto px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 rounded-xl font-bold"
                            >
                              Add First Resident
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {flatResidents.map((res, index) => (
                            <div key={res.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 relative group/card space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-mono">Member #{index + 1}</span>
                                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-sky-400" />
                                    {res.name}
                                  </h5>
                                </div>
                                {currentRole === 'Management' && (
                                  <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleOpenEditModal(res)}
                                      className="p-1 hover:bg-slate-800 rounded text-sky-400"
                                      title="Edit Resident"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(res.id)}
                                      className="p-1 hover:bg-slate-800 rounded text-rose-400"
                                      title="Delete Resident"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-slate-600 block uppercase">Mobile Number</span>
                                  <span className="text-slate-300 font-mono flex items-center gap-1">
                                    <Smartphone className="w-3 h-3 text-slate-500" />
                                    {res.mobile}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-slate-600 block uppercase">Demographics</span>
                                  <span className="text-slate-300">
                                    {res.sex}, {res.age} yrs
                                  </span>
                                </div>

                                {/* Audit Metadata Trail */}
                                <div className="col-span-2 pt-2 border-t border-slate-900/50 flex flex-col gap-1 text-[9px] text-slate-500 font-mono">
                                  <div className="flex justify-between">
                                    <span>Added: {res.createdAt ? formatDateTime(res.createdAt) : 'N/A'}</span>
                                    <span>By: {res.createdBy}</span>
                                  </div>
                                  {res.updatedAt && (
                                    <div className="flex justify-between text-sky-400/80 border-t border-slate-900/30 pt-0.5 mt-0.5">
                                      <span>Edited: {formatDateTime(res.updatedAt)}</span>
                                      <span>By: {res.updatedBy}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="glass-panel p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full min-h-[250px]">
                  <Compass className="w-8 h-8 text-slate-600 mb-2 animate-spin-slow" />
                  Select a Flat number card to see the family/resident list.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                Add Resident to #{flatNumber}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateResident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as '1BHK' | '2BHK')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Add Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                Edit Resident Details
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditingResident(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as '1BHK' | '2BHK')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Flat Number (Cannot be changed)</label>
                <input
                  type="text"
                  disabled
                  value={flatNumber}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingResident(null); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
