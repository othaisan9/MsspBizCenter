'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { tasksApi } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; name: string };
  dueDate?: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTasksUpdate: () => void;
}

const COLUMNS = [
  {
    id: 'pending',
    title: '할 일',
    headerColor: 'bg-gray-100',
    badgeColor: 'bg-gray-200 text-gray-800',
  },
  {
    id: 'in_progress',
    title: '진행 중',
    headerColor: 'bg-blue-100',
    badgeColor: 'bg-blue-200 text-blue-800',
  },
  {
    id: 'review',
    title: '리뷰',
    headerColor: 'bg-yellow-100',
    badgeColor: 'bg-yellow-200 text-yellow-800',
  },
  {
    id: 'completed',
    title: '완료',
    headerColor: 'bg-green-100',
    badgeColor: 'bg-green-200 text-green-800',
  },
];

export function KanbanBoard({ tasks, onTasksUpdate }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 상태별로 태스크 그룹화
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = localTasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = localTasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // 드롭된 위치가 컬럼인지 태스크인지 확인
    const overTask = localTasks.find((t) => t.id === over.id);
    const newStatus = overTask ? overTask.status : over.id as string;

    // 상태가 변경되지 않았으면 리턴
    if (activeTask.status === newStatus) {
      return;
    }

    // Optimistic update
    const previousTasks = [...localTasks];
    const updatedTasks = localTasks.map((task) =>
      task.id === activeTask.id ? { ...task, status: newStatus } : task
    );
    setLocalTasks(updatedTasks);

    try {
      // API 호출
      await tasksApi.updateStatus(activeTask.id, newStatus);

      // 성공 시 부모 컴포넌트에 알림
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);

      // 실패 시 이전 상태로 복원
      setLocalTasks(previousTasks);

      // 에러 알림 (선택사항)
      alert('업무 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasksByStatus[column.id] || []}
            headerColor={column.headerColor}
            badgeColor={column.badgeColor}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
