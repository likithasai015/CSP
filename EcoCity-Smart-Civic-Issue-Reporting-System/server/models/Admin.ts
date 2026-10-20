export interface IAdmin {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: Date;
}

export default IAdmin;
