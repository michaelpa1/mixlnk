import React from 'react';
import { Check, X, Clock, UserX, Users } from 'lucide-react';
import type { Listener } from '../types';

interface ListenerManagementProps {
  listeners: Listener[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ListenerManagement({ listeners, onApprove, onDeny, onRemove }: ListenerManagementProps) {
  const pendingListeners = listeners.filter(l => l.status === 'pending');
  const activeListeners = listeners.filter(l => l.status === 'approved');

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Listener Management</h2>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
          <Users className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white/80">
            {activeListeners.length} Active
          </span>
        </div>
      </div>

      {pendingListeners.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/60 mb-3">
            Pending Requests ({pendingListeners.length})
          </h3>
          <div className="space-y-3">
            {pendingListeners.map(listener => (
              <div key={listener.id} className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-medium text-white/90">{listener.name}</span>
                    <p className="text-sm text-white/60">Waiting for approval</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(listener.id)}
                    className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                    title="Approve listener"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDeny(listener.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Deny listener"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeListeners.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">
            Active Listeners ({activeListeners.length})
          </h3>
          <div className="space-y-3">
            {activeListeners.map(listener => (
              <div key={listener.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div>
                    <span className="font-medium text-white/90">{listener.name}</span>
                    <p className="text-sm text-white/60">
                      Connected {formatTime(listener.joinedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(listener.id)}
                  className="p-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                  title="Remove listener"
                >
                  <UserX className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {listeners.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No listeners yet</p>
          <p className="text-sm text-white/40">Share your stream link to get started</p>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}