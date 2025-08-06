export default class DnD {
  constructor(trello) {
    this.trello = trello;
    this.container = trello.container;
    this.data = trello.data;
    this.draggedEl = null;
    this.ghostEl = null;
    this.shiftX = 0;
    this.shiftY = 0;
    this.id = null;
    this.clone = null;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  toAppoint() {
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.querySelector('.trello__body').addEventListener('mouseleave', this.onMouseLeave);
  }

  onMouseLeave() {
    if (!this.draggedEl) return;
    this.cleanupDrag();
  }

  onMouseUp(evt) {
    if (!this.draggedEl) return;

    const elemBelow = document.elementFromPoint(evt.clientX, evt.clientY);
    if (elemBelow?.closest('.card__delete')) {
      this.cleanupDrag();
      return;
    }

    const placeholder = document.querySelector('[data-id="000000"]');
    if (placeholder) {
      const sibling = {
        id: placeholder.nextElementSibling?.dataset.id || null,
        column: placeholder.closest('.col__content').dataset.name,
      };

      // Обновляем данные
      this.data.relocate(this.draggedEl, sibling);

      // Плейсхолдер заменяется карточкой
      placeholder.replaceWith(this.draggedEl);
    }

    this.trello.data.saveState();
    this.cleanupDrag();
  }

  onMouseMove(evt) {
    if (!this.draggedEl) return;
    evt.preventDefault();

    this.ghostEl.style.left = `${evt.pageX - this.shiftX}px`;
    this.ghostEl.style.top = `${evt.pageY - this.shiftY}px`;

    this.addGhostEl(evt);
  }

  addGhostEl(evt) {
    const existingPlaceholder = document.querySelector('[data-id="000000"]');

    this.ghostEl.hidden = true;
    const elemBelow = document.elementFromPoint(evt.clientX, evt.clientY);
    this.ghostEl.hidden = false;

    // Если попали в колонку
    const contentContainer = elemBelow?.closest('.col__content');
    if (!contentContainer) {
      if (existingPlaceholder) existingPlaceholder.remove();
      return;
    }

    // Мгновенно вставляем плейсхолдер в пустую колонку
    const cards = Array.from(contentContainer.querySelectorAll('.col__card:not([data-id="000000"])'));
    if (cards.length === 0) {
      if (!existingPlaceholder || existingPlaceholder.parentElement !== contentContainer) {
        if (existingPlaceholder) existingPlaceholder.remove();
        this.createPlaceholder(contentContainer, null, true); // <-- пустая колонка
      }
      return;
    }

    const targetCard = elemBelow.closest('.col__card');
    if (targetCard && targetCard.dataset.id !== this.id) {
      const rect = targetCard.getBoundingClientRect();
      const isAfter = evt.clientY > rect.top + rect.height / 2;

      // Проверка: плейсхолдер уже на месте?
      if (
        existingPlaceholder &&
        ((isAfter && existingPlaceholder.previousElementSibling === targetCard) ||
         (!isAfter && existingPlaceholder.nextElementSibling === targetCard))
      ) {
        return;
      }

      if (existingPlaceholder) existingPlaceholder.remove();
      this.createPlaceholder(contentContainer, isAfter ? targetCard.nextSibling : targetCard);
    }
  }

  createPlaceholder(container, position = null, emptyColumn = false) {
    this.clone = document.createElement('div');
    this.clone.dataset.id = '000000';
    if (emptyColumn) {
      // Видимый плейсхолдер в пустой колонке
      this.clone.style.height = '50px';
      this.clone.style.border = '2px dashed #aaa';
      this.clone.style.borderRadius = '6px';
      this.clone.style.margin = '5px';
    } else {
      // Плейсхолдер как копия карточки
      this.clone = this.draggedEl.cloneNode(true);
      this.clone.dataset.id = '000000';
      this.clone.style.opacity = '0.3';
    }
    this.clone.style.pointerEvents = 'none';
    container.insertBefore(this.clone, position);
  }

  onMouseDown(evt) {
    if (!evt.target.closest('.col__card') || evt.target.classList.contains('card__delete') || evt.target.classList.contains('card__subBtn')) return;

    evt.preventDefault();
    document.body.style.userSelect = 'none';

    this.draggedEl = evt.target.closest('.col__card');
    this.id = this.draggedEl.dataset.id;

    const coords = this.draggedEl.getBoundingClientRect();
    this.shiftX = evt.clientX - coords.left;
    this.shiftY = evt.clientY - coords.top;

    this.ghostEl = this.draggedEl.cloneNode(true);
    this.ghostEl.classList.add('dragged');
    Object.assign(this.ghostEl.style, {
      width: `${this.draggedEl.offsetWidth}px`,
      position: 'absolute',
      zIndex: 1000,
      pointerEvents: 'none',
      left: `${coords.left}px`,
      top: `${coords.top}px`
    });

    document.body.appendChild(this.ghostEl);
    this.draggedEl.classList.add('darkened');

    // Ставим плейсхолдер на место карточки
    const placeholder = this.draggedEl.cloneNode(true);
    placeholder.dataset.id = '000000';
    placeholder.style.opacity = '0.3';
    this.draggedEl.parentElement.insertBefore(placeholder, this.draggedEl);
    this.draggedEl.remove();

    document.body.style.cursor = 'grabbing';
    this.container.addEventListener('mousemove', this.onMouseMove);
  }

  cleanupDrag() {
    if (this.ghostEl) this.ghostEl.remove();
    document.querySelectorAll('[data-id="000000"]').forEach(el => el.remove());
    document.body.style.cursor = 'auto';
    document.body.style.userSelect = '';
    this.container.removeEventListener('mousemove', this.onMouseMove);
    if (this.draggedEl) this.draggedEl.classList.remove('darkened');
    this.draggedEl = null;
    this.ghostEl = null;
  }
}
