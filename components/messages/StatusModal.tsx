import { useState } from 'react';
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Status {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  status_media: string;
  status_type: 'image' | 'video';
  timestamp: string;
  is_viewed: boolean;
  viewers?: number;
}

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: Status[];
}

export default function StatusModal({ isOpen, onClose, statuses }: StatusModalProps) {
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [groupedStatuses] = useState(() => {
    const grouped: { [key: string]: Status[] } = {};
    statuses.forEach((status) => {
      if (!grouped[status.user_id]) {
        grouped[status.user_id] = [];
      }
      grouped[status.user_id].push(status);
    });
    return Object.entries(grouped).map(([userId, userStatuses]) => ({
      userId,
      userName: userStatuses[0].user_name,
      userAvatar: userStatuses[0].user_avatar,
      statuses: userStatuses,
    }));
  });

  if (!isOpen) return null;

  const currentGroup = groupedStatuses[Math.floor(selectedStatusIndex / Math.max(groupedStatuses[0]?.statuses.length || 1, 1))];
  const currentStatusInGroup = selectedStatusIndex % Math.max(groupedStatuses[0]?.statuses.length || 1, 1);
  const currentStatus = currentGroup?.statuses[currentStatusInGroup];

  const handleNext = () => {
    if (selectedStatusIndex < statuses.length - 1) {
      setSelectedStatusIndex(selectedStatusIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (selectedStatusIndex > 0) {
      setSelectedStatusIndex(selectedStatusIndex - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-screen overflow-hidden rounded-2xl bg-black relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {currentGroup?.userAvatar && (
              <img
                src={currentGroup.userAvatar}
                alt={currentGroup.userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">{currentGroup?.userName}</h3>
              <p className="text-xs text-gray-300">
                {selectedStatusIndex + 1} de {statuses.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress bars */}
        <div className="absolute top-16 left-0 right-0 z-20 flex gap-1 px-4 py-2 bg-black/40">
          {groupedStatuses.map((group, idx) => (
            <div key={group.userId} className="flex-1 flex gap-0.5">
              {group.statuses.map((_, statusIdx) => (
                <div
                  key={statusIdx}
                  className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      idx < Math.floor(selectedStatusIndex / Math.max(groupedStatuses[0]?.statuses.length || 1, 1))
                        ? 'bg-white w-full'
                        : idx === Math.floor(selectedStatusIndex / Math.max(groupedStatuses[0]?.statuses.length || 1, 1)) &&
                          statusIdx <= currentStatusInGroup
                        ? 'bg-white w-full'
                        : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="w-full aspect-video bg-gray-900 relative flex items-center justify-center">
          {currentStatus?.status_type === 'image' ? (
            <img
              src={currentStatus.status_media}
              alt="Status"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentStatus?.status_media}
              className="w-full h-full object-contain"
              autoPlay
              controls
            />
          )}
        </div>

        {/* Navigation buttons */}
        {selectedStatusIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all z-10 backdrop-blur-sm"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
        )}

        {selectedStatusIndex < statuses.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all z-10 backdrop-blur-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-white"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          <p className="text-sm text-gray-300">
            {currentStatus?.viewers && `Visto por ${currentStatus.viewers} personas`}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(currentStatus?.timestamp || '').toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
