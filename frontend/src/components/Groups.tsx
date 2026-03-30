import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Group } from '@/types';
import { API_URL } from '@/config';
import {
  Plus,
  Users,
  Crown,
  UserPlus,
  Trash2,
  LogOut,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function Groups() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleEsc = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreate(false); }, []);
  useEffect(() => { document.addEventListener('keydown', handleEsc); return () => document.removeEventListener('keydown', handleEsc); }, [handleEsc]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setGroups(await res.json());
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (res.ok) {
        setNewGroupName('');
        setShowCreate(false);
        fetchGroups();
        showToast('Group created!', 'success');
      }
    } catch {
      showToast('Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (groupId: string) => {
    if (!inviteUsername.trim()) return;
    setInviting(groupId);
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: inviteUsername.trim() })
      });
      if (res.ok) {
        setInviteUsername('');
        fetchGroups();
        showToast('Member added!', 'success');
      } else {
        const data = await res.json();
        showToast(data.detail || 'Failed to invite', 'error');
      }
    } catch {
      showToast('Failed to invite member', 'error');
    } finally {
      setInviting(null);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchGroups();
        showToast('Member removed', 'success');
      } else {
        const data = await res.json();
        showToast(data.detail || 'Failed to remove', 'error');
      }
    } catch {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchGroups();
        showToast('Left group', 'success');
      }
    } catch {
      showToast('Failed to leave group', 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchGroups();
        showToast('Group deleted', 'success');
      }
    } catch {
      showToast('Failed to delete group', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Groups
            </h1>
            <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Manage your company & team groups</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Group</span>
          </button>
        </div>
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF6B4A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10">
            <Users className="w-16 h-16 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-4" />
            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-lg mb-1">No groups yet</p>
            <p className="text-[#1E1E2E]/40 dark:text-white/40 text-sm">Create a group to share templates with your team</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isOwner = group.owner_id === user?.id;
              const isExpanded = expandedGroup === group.id;
              return (
                <div key={group.id} className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FFFBF7] dark:hover:bg-[#0D0D0F] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#1E1E2E] dark:text-white">{group.name}</h3>
                          {isOwner && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                              <Crown className="w-3 h-3" />
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" /> : <ChevronDown className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#1E1E2E]/5 dark:border-white/5">
                      {/* Members */}
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-[#1E1E2E] dark:text-white mb-3">Members</h4>
                        {group.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{member.username[0].toUpperCase()}</span>
                              </div>
                              <span className="text-sm text-[#1E1E2E] dark:text-white">{member.username}</span>
                              {member.role === 'owner' && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Owner</span>
                              )}
                            </div>
                            {isOwner && member.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(group.id, member.id)}
                                className="p-1.5 text-[#1E1E2E]/30 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Invite (owner only) */}
                      {isOwner && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">Invite Member</h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={inviteUsername}
                              onChange={(e) => setInviteUsername(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(group.id); }}
                              placeholder="Enter username"
                              className="flex-1 px-4 py-2.5 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40 text-sm"
                            />
                            <button
                              onClick={() => handleInvite(group.id)}
                              disabled={inviting === group.id}
                              className="px-4 py-2.5 bg-violet-600 text-white font-medium text-sm rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              {inviting === group.id ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {isOwner ? (
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Group
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLeaveGroup(group.id)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Leave Group
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1F] rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Create Group
            </h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (e.g. Avengers)"
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40 mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 bg-[#1E1E2E]/5 dark:bg-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || creating}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
