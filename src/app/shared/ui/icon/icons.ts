import arrowBack from '../../../../assets/icons/arrow-back.svg';
import arrowDropDown from '../../../../assets/icons/arrow-drop-down.svg';
import arrowForward from '../../../../assets/icons/arrow-forward.svg';
import burger from '../../../../assets/icons/burger.svg';
import chat from '../../../../assets/icons/chat.svg';
import check from '../../../../assets/icons/check.svg';
import chevronBack from '../../../../assets/icons/chevron-back.svg';
import chevronForward from '../../../../assets/icons/chevron-forward.svg';
import close from '../../../../assets/icons/close.svg';
import code from '../../../../assets/icons/code.svg';
import eye from '../../../../assets/icons/eye.svg';
import eyeOff from '../../../../assets/icons/eye-off.svg';
import flame from '../../../../assets/icons/flame.svg';
import google from '../../../../assets/icons/google.svg';
import heart from '../../../../assets/icons/heart.svg';
import heartFilled from '../../../../assets/icons/heart-filled.svg';
import lock from '../../../../assets/icons/lock.svg';
import logo from '../../../../assets/icons/logo.svg';
import mail from '../../../../assets/icons/mail.svg';
import rss from '../../../../assets/icons/rss.svg';
import send from '../../../../assets/icons/send.svg';
import share from '../../../../assets/icons/share.svg';
import star from '../../../../assets/icons/star.svg';
import starFilled from '../../../../assets/icons/star-filled.svg';
import upload from '../../../../assets/icons/upload.svg';
import user from '../../../../assets/icons/user.svg';

export type IconName =
  | 'arrowBack'
  | 'arrowDropDown'
  | 'arrowForward'
  | 'burger'
  | 'chat'
  | 'check'
  | 'chevronBack'
  | 'chevronForward'
  | 'close'
  | 'code'
  | 'eye'
  | 'eyeOff'
  | 'flame'
  | 'google'
  | 'heart'
  | 'heartFilled'
  | 'lock'
  | 'logo'
  | 'mail'
  | 'rss'
  | 'send'
  | 'share'
  | 'star'
  | 'starFilled'
  | 'upload'
  | 'user';

/**
 * Every icon of the app: the SVG files are bundled as text (see `angular.json`), so they are
 * inlined and can use `currentColor`.
 */
export const ICONS: Readonly<Record<IconName, string>> = {
  arrowBack,
  arrowDropDown,
  arrowForward,
  burger,
  chat,
  check,
  chevronBack,
  chevronForward,
  close,
  code,
  eye,
  eyeOff,
  flame,
  google,
  heart,
  heartFilled,
  lock,
  logo,
  mail,
  rss,
  send,
  share,
  star,
  starFilled,
  upload,
  user,
};
