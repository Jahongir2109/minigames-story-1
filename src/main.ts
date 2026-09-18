import '@/styles/main.scss';
import { createApp } from '@/app';

const root = document.createElement('div');
root.id = 'app';
document.body.append(root);

createApp(root);
