// Organization domain type (GET/POST /api/organizations).

export interface OrganizationRecord {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
}
