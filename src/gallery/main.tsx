import { createRoot } from 'react-dom/client';
import GalleryApp from './GalleryApp';
import './gallery.css';

const root = document.getElementById('gallery-root');
if (!root) throw new Error('Gallery root element was not found.');

createRoot(root).render(<GalleryApp />);
