import React from 'react';
import { Users, Search, Filter, MoreVertical } from 'lucide-react';

const mockListeners = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    lastActive: '2025-02-25T10:30:00Z',
    status: 'online',
    totalListeningTime: '45h 30m'
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    lastActive: '2025-02-24T15:45:00Z',
    status: 'offline',
    totalListeningTime: '12h 15m'
  },
  // Add more mock data as needed
];

export function ListenersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Listeners</h1>
        <p className="text-white/60">View and manage your stream listeners</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Total Listeners</h3>
          <div className="text-3xl font-bold">1,234</div>
          <p className="text-sm text-white/40 mt-1">+12% from last month</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Active Now</h3>
          <div className="text-3xl font-bold">56</div>
          <p className="text-sm text-white/40 mt-1">Across all streams</p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-2">Average Listen Time</h3>
          <div className="text-3xl font-bold">45m</div>
          <p className="text-sm text-white/40 mt-1">Per session</p>
        </div>
      </div>

      {/* Listeners Table */}
      <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
        {/* Table Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search listeners..."
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-white/10">
          {mockListeners.map(listener => (
            <div key={listener.id} className="p-4 flex items-center justify-between hover:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-500 font-medium">
                    {listener.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{listener.name}</h3>
                  <p className="text-sm text-white/60">{listener.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium">Total Time</p>
                  <p className="text-sm text-white/60">{listener.totalListeningTime}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  listener.status === 'online' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-white/5 text-white/60'
                }`}>
                  {listener.status}
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}