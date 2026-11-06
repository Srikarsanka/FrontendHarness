import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusColor',
  standalone: true
})
export class StatusColorPipe implements PipeTransform {
  private readonly colorMap: Record<string, string> = {
    // Task Status
    'BACKLOG': 'status-backlog',
    'TODO': 'status-todo',
    'IN_PROGRESS': 'status-in-progress',
    'IN_REVIEW': 'status-in-review',
    'DONE': 'status-done',
    'CANCELLED': 'status-cancelled',

    // Project Status
    'PLANNING': 'status-planning',
    'ACTIVE': 'status-active',
    'ON_HOLD': 'status-on-hold',
    'COMPLETED': 'status-completed',
    'ARCHIVED': 'status-archived',

    // Task Priority
    'CRITICAL': 'priority-critical',
    'HIGH': 'priority-high',
    'MEDIUM': 'priority-medium',
    'LOW': 'priority-low'
  };

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return this.colorMap[value] || '';
  }
}
