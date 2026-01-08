import { Router } from 'express';
import {
  getChatsController,
  getMessagesController,
  createChatController,
  sendMessageController,
  deleteChatController,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getChatsController);
router.post('/', createChatController);
router.get('/:chatId/messages', getMessagesController);
router.post('/message', sendMessageController);
router.delete('/:chatId', deleteChatController);

export default router;
