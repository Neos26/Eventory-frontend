// Organization domain type (GET/POST /api/organizations).

export interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface OrganizationRecord {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: OrganizationAddress;
  isActive?: boolean;
}

export interface CreateOrganizationPayload {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
}

// Partial so callers can toggle isActive without resending the form fields.
export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload> & {
  isActive?: boolean;
};
