import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }
  }
}
