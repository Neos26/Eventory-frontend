import { useParams } from 'react-router-dom';
import PagePlaceholder from '../components/PagePlaceholder';

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <PagePlaceholder
      title={`Edit Event #${id}`}
      description="Form for updating an existing event."
      route="/events/:id/edit"
    />
  );
}
