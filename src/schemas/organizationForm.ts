import type { CreateOrganizationPayload, OrganizationRecord } from '../types/organization';

// Shape of the create/edit organization form. Kept as strings so the inputs
// stay controlled while the user types.
export interface OrganizationFormValues {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
}

export type OrganizationFormErrors = Partial<Record<keyof OrganizationFormValues, string>>;

export const emptyOrganizationForm: OrganizationFormValues = {
  name: '',
  description: '',
  email: '',
  phone: '',
  website: '',
};

export function validateOrganizationForm(values: OrganizationFormValues): OrganizationFormErrors {
  const errors: OrganizationFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Organization name is required';
  } else if (values.name.trim().length > 150) {
    errors.name = 'Organization name must be 150 characters or fewer';
  }

  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (values.phone.trim().length > 30) {
    errors.phone = 'Phone must be 30 characters or fewer';
  }

  if (values.website.trim().length > 200) {
    errors.website = 'Website must be 200 characters or fewer';
  }

  if (values.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or fewer';
  }

  return errors;
}

// Prefill the form from an API record.
export function organizationToFormValues(organization: OrganizationRecord): OrganizationFormValues {
  return {
    name: organization.name,
    description: organization.description ?? '',
    email: organization.email ?? '',
    phone: organization.phone ?? '',
    website: organization.website ?? '',
  };
}

// Empty optional fields are omitted so the backend keeps existing values tidy.
export function organizationFormToPayload(values: OrganizationFormValues): CreateOrganizationPayload {
  return {
    name: values.name.trim(),
    ...(values.description.trim() && { description: values.description.trim() }),
    ...(values.email.trim() && { email: values.email.trim().toLowerCase() }),
    ...(values.phone.trim() && { phone: values.phone.trim() }),
    ...(values.website.trim() && { website: values.website.trim() }),
  };
}
