import { useParams } from 'react-router-dom';
import PagePlaceholder from '../components/PagePlaceholder';

export default function EventRequirements() {
  const { id } = useParams<{ id: string }>();
  return (
    <PagePlaceholder
      title={`Requirements — Event #${id}`}
      description="Resources this event needs, with quantities and due dates."
      route="/events/:id/requirements"
    />
  );
}
