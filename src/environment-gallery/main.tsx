import React from 'react';
import { createRoot } from 'react-dom/client';
import { EnvironmentGalleryApp } from './EnvironmentGalleryApp';
import './environment-gallery.css';

const root = document.getElementById('environment-gallery-root');
if (root === null) throw new Error('Missing environment gallery root');
createRoot(root).render(<EnvironmentGalleryApp />);
