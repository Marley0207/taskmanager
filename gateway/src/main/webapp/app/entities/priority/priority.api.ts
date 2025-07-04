import axios from 'axios';
import { IPriority } from './priority.model';

const API_URL = '/services/taskmanager/api/priorities';

export const getAllPriorities = () => axios.get<IPriority[]>(API_URL);
export const getPriority = (id: number) => axios.get<IPriority>(`${API_URL}/${id}`);
export const createPriority = (priority: IPriority) => axios.post<IPriority>(API_URL, priority);
export const updatePriority = (priority: IPriority) => axios.put<IPriority>(`${API_URL}/${priority.id}`, priority);
export const patchPriority = (id: number, priority: Partial<IPriority>) => axios.patch<IPriority>(`${API_URL}/${id}`, priority);
export const deletePriority = (id: number) => axios.delete(`${API_URL}/${id}`);
export const hidePriority = (id: number) => axios.put<IPriority>(`${API_URL}/${id}/hide`);
export const unhidePriority = (id: number) => axios.put<IPriority>(`${API_URL}/${id}/unhide`);
