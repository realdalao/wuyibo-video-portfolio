import { getStore } from '@edgeone/pages-blob';
import { createLikesHandler } from '../../../server/likes.mjs';

const handler = createLikesHandler(() => getStore({ name: 'portfolio-likes-v1', consistency: 'strong' }));
export const onRequestGet = handler;
export const onRequestPost = handler;
