import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IComment } from '../task.model';

interface CommentSectionProps {
  commentText: string;
  setCommentText: (text: string) => void;
  commentLoading: boolean;
  handleCreateComment: () => void;
  comments: IComment[];
  commentsLoading: boolean;
  editingCommentId: number | null;
  editingCommentText: string;
  setEditingCommentText: (text: string) => void;
  editingLoading: boolean;
  handleUpdateComment: () => void;
  startEditComment: (comment: IComment) => void;
  setEditingCommentId: (id: number | null) => void;
  openDeleteModal: (comment: IComment) => void;
  deletingLoading: boolean;
  deletingCommentId: number | null;
  formatDate: (dateString: string) => string;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  commentText,
  setCommentText,
  commentLoading,
  handleCreateComment,
  comments,
  commentsLoading,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  editingLoading,
  handleUpdateComment,
  startEditComment,
  setEditingCommentId,
  openDeleteModal,
  deletingLoading,
  deletingCommentId,
  formatDate,
}) => (
  <>
    <div style={{ marginTop: 32 }}>
      <h3>Agregar comentario</h3>
      <textarea
        className="form-control"
        rows={3}
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        placeholder="Escribe tu comentario aquí..."
        disabled={commentLoading}
        style={{ marginBottom: 8, maxWidth: 500 }}
      />
      <br />
      <button className="btn btn-primary btn-sm" onClick={handleCreateComment} disabled={commentLoading || !commentText.trim()}>
        {commentLoading ? 'Enviando...' : 'Comentar'}
      </button>
    </div>

    <div style={{ marginTop: 32 }}>
      <h3>Comentarios</h3>
      {commentsLoading ? (
        <div>Cargando comentarios...</div>
      ) : comments.length === 0 ? (
        <div style={{ color: 'gray' }}>No hay comentarios para esta tarea.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {comments.map(comment => (
            <li key={comment.id} style={{ marginBottom: 16, background: '#f8f9fa', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {comment.author?.firstName} {comment.author?.lastName} ({comment.author?.login})
              </div>
              {editingCommentId === comment.id ? (
                <>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editingCommentText}
                    onChange={e => setEditingCommentText(e.target.value)}
                    disabled={editingLoading}
                    style={{ marginBottom: 8 }}
                  />
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleUpdateComment}
                    disabled={editingLoading || !editingCommentText.trim()}
                  >
                    Guardar
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingCommentText('');
                    }}
                    disabled={editingLoading}
                    style={{ marginLeft: 8 }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 4 }}>{comment.content}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{comment.createdAt && formatDate(comment.createdAt)}</div>
                  <button
                    className="btn btn-outline-primary btn-xs"
                    style={{ marginTop: 4, marginRight: 8 }}
                    onClick={() => startEditComment(comment)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-outline-danger btn-xs"
                    style={{ marginTop: 4 }}
                    onClick={() => openDeleteModal(comment)}
                    disabled={deletingLoading && deletingCommentId === comment.id}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </>
);

export default CommentSection;
