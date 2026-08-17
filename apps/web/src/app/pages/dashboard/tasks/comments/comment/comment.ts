import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Comment, Task } from '@todo-workspace/tasks';
import { User } from '@todo-workspace/users';
import { CommentsService } from '../../../../../core/comments/comments.service';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-comment',
  imports: [DatePipe],
  templateUrl: './comment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex justify-between items-start gap-4 bg-gray-50 p-3 rounded-sm border border-gray-100'
  },
})
export class CommentComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly task = input.required<Task | null | undefined>();
  readonly comment = input.required<Comment>();
  readonly currentUser = input.required<User | null>();

  async deleteComment(commentId: number) {
    const task = this.task();

    if (!task) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Delete Comment',
      message: `Are you sure you want to delete comment?`,
    });

    if (confirmed) {
      this.commentsService.deleteComment(task.id, commentId);
    }
  }
}
