import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X as XIcon } from 'lucide-react';

interface SortableMediaGridProps {
  mediaUrls: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}

function SortableMediaItem({
  url,
  index,
  totalCount,
  onRemove,
}: {
  url: string;
  index: number;
  totalCount: number;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `media-${index}-${url}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-md border ${
        isDragging ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/50'
      }`}
      role="listitem"
    >
      {/* Grip handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        style={{ minWidth: 24, minHeight: 24 }}
        aria-label={`Drag to reorder media ${index + 1}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 z-10 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        aria-label={`Remove media ${index + 1}`}
      >
        <XIcon className="h-3 w-3" />
      </button>

      {/* Media thumbnail */}
      {url.match(/\.(mp4|mov|webm|avi)$/i) ? (
        <video
          src={url}
          className="w-full h-24 object-cover rounded-md"
          muted
          aria-label={`Video attachment ${index + 1} of ${totalCount}`}
        />
      ) : (
        <img
          src={url}
          alt={`Image attachment ${index + 1} of ${totalCount}`}
          className="w-full h-24 object-cover rounded-md"
          draggable={false}
        />
      )}

      {/* Position indicator */}
      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white" aria-hidden="true">
        {index + 1}
      </span>
    </div>
  );
}

export function SortableMediaGrid({ mediaUrls, onReorder, onRemove }: SortableMediaGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = mediaUrls.map((url, i) => `media-${i}-${url}`);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = items.indexOf(active.id as string);
    const toIndex = items.indexOf(over.id as string);
    if (fromIndex !== -1 && toIndex !== -1) {
      onReorder(fromIndex, toIndex);
    }
  };

  const activeIndex = activeId ? items.indexOf(activeId) : -1;
  const activeUrl = activeIndex >= 0 ? mediaUrls[activeIndex] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div
          className="grid grid-cols-4 gap-2"
          role="list"
          aria-label={`Media attachments. ${mediaUrls.length} item${mediaUrls.length !== 1 ? 's' : ''}. Use the drag handles to reorder. Arrow keys, Enter or Space to grab, Escape to cancel.`}
        >
          {mediaUrls.map((url, i) => (
            <SortableMediaItem
              key={items[i]}
              url={url}
              index={i}
              totalCount={mediaUrls.length}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeUrl && (
          <div className="rounded-md border-2 border-primary shadow-xl">
            <img
              src={activeUrl}
              alt="Dragging"
              className="w-24 h-24 object-cover rounded-md"
              draggable={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default SortableMediaGrid;
