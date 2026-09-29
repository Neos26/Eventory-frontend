import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Table from '../components/Table';
import type { TableColumn } from '../components/Table';
import SearchBar from '../components/SearchBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { resources as mockResources, resourceCategories } from '../api/mockData';
import type { Resource } from '../api/mockData';
import useDocumentTitle from '../hooks/useDocumentTitle';

function stockBadge(resource: Resource) {
  if (resource.available === 0) return <Badge tone="red">Out of stock</Badge>;
  if (resource.available / resource.total < 0.25) return <Badge tone="amber">Low stock</Badge>;
  return <Badge tone="green">In stock</Badge>;
}

const columns: TableColumn<Resource>[] = [
  {
    key: 'name',
    header: 'Resource',
    render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
  },
  { key: 'category', header: 'Category', render: (row) => row.category },
  { key: 'total', header: 'Total Qty', render: (row) => row.total },
  { key: 'available', header: 'Available', render: (row) => row.available },
  { key: 'status', header: 'Status', render: (row) => stockBadge(row) },
];

const categoryOptions = [
  { value: '', label: 'All categories' },
  ...resourceCategories.map((category) => ({ value: category, label: category })),
];

export default function Resources() {
  useDocumentTitle('Resources');

  // Simulated load so the LoadingState component is exercised without an API.
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return mockResources.filter((resource) => {
      const matchesQuery = resource.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === '' || resource.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const handleSave = () => {
    // Frontend only for now - nothing is sent to the backend.
    setModalOpen(false);
    setName('');
    setQuantity('');
  };

  return (
    <>
      <PageHeader
        title="Resources"
        description="Equipment and materials available for events."
        actions={<Button onClick={() => setModalOpen(true)}>Add Resource</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search resources..." />
        <Select
          options={categoryOptions}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading resources..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Try a different search term or category filter."
        />
      ) : (
        <Table
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          emptyMessage="No resources match your filters."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Resource"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Resource name"
            name="resourceName"
            placeholder="e.g. Folding Chair"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Quantity"
            name="resourceQuantity"
            type="number"
            min={1}
            placeholder="e.g. 50"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Select label="Category" options={categoryOptions} name="resourceCategory" />
        </div>
      </Modal>
    </>
  );
}
