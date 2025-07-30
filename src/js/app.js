import DnD from './DnD';
import Trello from './Trello';

const trello = new Trello();

trello.bindToDOM(document.querySelector('.container'));
trello.drawUI();
trello.toAppoint();
const dnd = new DnD(trello);
dnd.toAppoint();
