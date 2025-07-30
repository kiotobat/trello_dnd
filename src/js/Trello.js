import Data from './Data';

export default class Trello {
  constructor() {
    this.data = new Data();
    this.container = null;
    this.adding = null;
    this.texarea = null;

    this.onClick = this.onClick.bind(this);
  }

  bindToDOM(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('container is not HTMLElement');
    }
    this.container = container;
  }

  drawUI() {
    this.container.innerHTML = Trello.markUp;
    this.data.update();
    this.redrawDOM();
  }

  redrawDOM() {
    if (document.querySelector('[data-id="111111"]')) document.querySelector('[data-id="111111"]').remove();
    if (document.querySelector('[data-id="000000"]')) document.querySelector('[data-id="000000"]').remove();
    this.redrawColumn(this.container.querySelector('[data-name="todo"]'));
    this.redrawColumn(this.container.querySelector('[data-name="progress"]'));
    this.redrawColumn(this.container.querySelector('[data-name="done"]'));
    document.body.style.cursor = 'auto';
  }

  toAppoint() {
    this.container.addEventListener('click', this.onClick);
  }

  onClick(evt) {
    if (evt.target.className === 'col__add' || evt.target.className === 'col__addText') {
      return this.onColAddClick(evt);
    }
    if (evt.target.className === 'add__cancel') {
      return this.onColAddingCancelClick(evt);
    }
    if (evt.target.className === 'add__button') {
      return this.addCard(evt);
    }
    if (evt.target.className === 'card__delete') {
      return this.deleteCard(evt);
    }
    if (evt.target.className === 'card__subBtn') {
      return evt.target.closest('.col__card').querySelector('.card__subMenu').classList.toggle('d_none');
    }
    return false;
  }

  deleteCard(evt) {
    const targetID = evt.target.closest('.col__card').dataset.id;
    const container = evt.target.closest('.col__content');
    this.data.delete(targetID, container.dataset.name);
    this.redrawColumn(container);
    this.data.saveState();
  }

  addCard(evt) {
    this.textarea = evt.target.closest('.col__footer').querySelector('.add__textarea');
    const title = this.textarea.value;
    const colContent = evt.target.closest('.trello__col').querySelector('.col__content');

    if (title) {
      this.data.create(colContent.dataset.name, title);
      this.redrawColumn(colContent);
      this.textarea.value = '';
      this.adding.classList.add('d_none');
      this.data.saveState();
    }
  }

  redrawColumn(column) {
    this.column = column;
    const prop = column.dataset.name;
    this.column.innerHTML = '';
    this.data.memory[prop].forEach((e) => {
      this.column.insertAdjacentHTML('beforeend', Trello.cardMarkUP(e.text, e.id));
      this.checkScroll(column);
    });
  }

  checkScroll(column) {
    this.column = column;
    const scroll = this.column.closest('.trello__col').querySelector('.scroll');
    if (this.column.offsetHeight >= 555) {
      scroll.classList.remove('d_none');
      return;
    }
    scroll.className = 'scroll d_none';
  }

  onColAddingCancelClick(evt) {
    this.adding.classList.add('d_none');
    this.textarea = evt.target.closest('.col__footer').querySelector('.add__textarea');
    this.textarea.value = '';
  }

  onColAddClick(evt) {
    [...this.container.querySelectorAll('.col__adding')].forEach((e) => e.classList.add('d_none'));
    this.adding = evt.target.closest('.col__footer').querySelector('.col__adding');
    this.adding.classList.remove('d_none');
    const textarea = this.adding.querySelector('.add__textarea');
    textarea.focus();
  }

  static cardMarkUP(text, id) {
    return `<div data-id="${id}" class="col__card card">
    <button class="card__delete">&#10006;</button>
    <div class="card__text">${text}</div>
    <button class="card__subBtn"></button>
    <span class="card__subMenu d_none">
      <label class="subMenu__item">
        <button class="like">&#x1F44D;</button>
        <span class="quantity">1</span>
      </label>
      <label class="subMenu__item">
        <button class="dizlike">&#128078;</button>
        <span class="quantity">2</span>
      </label>
      <label class="subMenu__item">
        <span class="mes"></span>
        <span class="quantity">3</span>
      </label>
    </span>
  </div>`;
  }

  static get markUp() {
    return `<div class="trello">
    <div class="trello__body">
      <div class="trello__content">

        <div class="trello__col col">
          <div class="col__header">
            <h3 class="col__title">TODO</h3>
            <button class="col__menu"></button>
          </div>
          <div data-name="todo" class="col__content"></div>
          <div class="col__footer">
            <span class="scroll d_none"></span>
            <button class="col__add">&#10010; <span class="col__addText">Add another card</span></button>
            <div class="col__adding add d_none">
              <textarea class="add__textarea" placeholder="Enter a title for this card..."></textarea>
              <div class="add__controls">
                <div class="add__buttons">
                  <button class="add__button">Add Card</button>
                  <button class="add__cancel">&#10006;</button>
                </div>
                <button class="col__menu"></button>
              </div>
            </div>
          </div>
        </div>

        <div class="trello__col col">
          <div class="col__header">
            <h3 class="col__title">IN PROGRESS</h3>
            <button class="col__menu"></button>
          </div>
          <div data-name="progress" class="col__content"></div>
          <div class="col__footer">
            <span class="scroll d_none"></span>
            <button class="col__add">&#10010; <span class="col__addText">Add another card</span></button>
            <div class="col__adding add d_none">
              <textarea class="add__textarea" placeholder="Enter a title for this card..."></textarea>
              <div class="add__controls">
                <div class="add__buttons">
                  <button class="add__button">Add Card</button>
                  <button class="add__cancel">&#10006;</button>
                </div>
                <button class="col__menu"></button>
              </div>
            </div>
          </div>
        </div>

        <div class="trello__col col">
          <div class="col__header">
            <h3 class="col__title">DONE</h3>
            <button class="col__menu"></button>
          </div>
          <div data-name="done" class="col__content"></div>
          <div class="col__footer">
            <span class="scroll d_none"></span>
            <button class="col__add">&#10010; <span class="col__addText">Add another card</span></button>
            <div class="col__adding add d_none">
              <textarea class="add__textarea" placeholder="Enter a title for this card..."></textarea>
              <div class="add__controls">
                <div class="add__buttons">
                  <button class="add__button">Add Card</button>
                  <button class="add__cancel">&#10006;</button>
                </div>
                <button class="col__menu"></button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>`;
  }
}
