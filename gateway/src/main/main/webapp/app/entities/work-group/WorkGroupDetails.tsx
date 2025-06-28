import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface IUser {
  id?: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const WorkGroupDetails = () => {
  const { id } = useParams();
  const [members, setMembers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/services/taskmanager/api/work-groups/${id}/members`)
      .then(response => {
        setMembers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al obtener los miembros del grupo:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p>Cargando miembros del grupo...</p>;
  }

  return (
    <div>
      <h2>Miembros del Grupo</h2>
      {members.length === 0 ? (
        <p>No hay miembros asignados a este grupo.</p>
      ) : (
        <ul>
          {members.map(user => (
            <li key={user.id}>
              {user.login} - {user.firstName} {user.lastName} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WorkGroupDetails; 