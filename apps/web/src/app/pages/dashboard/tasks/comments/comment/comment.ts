import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { User } from '@todo-workspace/users';
import { Comment, Task } from '@todo-workspace/tasks';
import { CommentsService } from '../../../../../core/comments/comments.service';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/confirm-dialog.service';

export type CommentActionMode = 'none' | 'edit' | 'reply';

@Component({
  selector: 'app-comment',
  imports: [DatePipe, FormsModule],
  templateUrl: './comment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block bg-gray-50 mb-2 p-3 rounded-sm border border-gray-100 group',
  },
})
export class CommentComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly task = input.required<Task | null | undefined>();
  readonly comment = input.required<Comment>();
  readonly currentUser = input.required<User | null>();

  readonly activeMode = signal<CommentActionMode>('none');
  readonly inputText = signal('');

  toggleEdit() {
    if (this.activeMode() === 'edit') {
      this.cancelAction();
    } else {
      this.activeMode.set('edit');
      this.inputText.set(this.comment().content);
    }
  }

  toggleReply() {
    if (this.activeMode() === 'reply') {
      this.cancelAction();
    } else {
      this.activeMode.set('reply');
      this.inputText.set('');
    }
  }

  cancelAction() {
    this.activeMode.set('none');
    this.inputText.set('');
  }

  submitAction() {
    const text = this.inputText().trim();
    const task = this.task();
    const currComment = this.comment();
    const mode = this.activeMode();

    if (!text || !task || mode === 'none') return;

    if (mode === 'edit') {
      this.commentsService
        .updateComment(task.id, currComment.id, text)
        .subscribe(() => this.cancelAction());
    } else if (mode === 'reply') {
      this.commentsService
        .addComment(task.id, text, currComment.id)
        .subscribe(() => this.cancelAction());
    }
  }

  async deleteComment(commentId: number) {
    const task = this.task();

    if (!task) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Delete Comment',
      message: `Are you sure you want to delete comment?`,
    });

    if (confirmed) {
      this.commentsService.deleteComment(task.id, commentId).subscribe();
    }
  }
}
