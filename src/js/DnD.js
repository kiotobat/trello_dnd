export default class DnD {
  constructor(trello) {
    this.trello = trello;
    this.container = trello.container;
    this.data = trello.data;
    this.draggedEl = null;
    this.ghostEl = null;
    this.shiftX = null;
    this.shiftY = null;
    this.id = null;
    this.clone = null;
    this.sibling = null;
    this.originalPosition = null;

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
    if (!this.draggedEl) {
      return;
    }
    this.draggedEl.classList.remove('darkened');
    this.ghostEl.remove();
    document.body.style.cursor = 'auto';
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.originalPosition = null;
  }

  onMouseUp(evt) {
    const elemBelow = document.elementFromPoint(evt.clientX, evt.clientY);
    if (!this.draggedEl || elemBelow.closest('.card__delete')) {
      return;
    }

    if (this.clone && (elemBelow.closest('.col__content') || elemBelow.closest('.col__footer') || elemBelow.closest('.col__header'))) {
      if (this.clone.nextElementSibling) {
        this.sibling = {
          id: this.clone.nextElementSibling.dataset.id,
          column: this.clone.closest('.col__content').dataset.name,
        };
      } else if (elemBelow.closest('.darkened')) {
        if (elemBelow.closest('.col__card').nextElementSibling) {
          this.sibling = {
            id: elemBelow.closest('.col__card').nextElementSibling.dataset.id,
            column: elemBelow.closest('.col__content').dataset.name,
          };
        } else {
          this.sibling = {
            id: null,
            column: elemBelow.closest('.col__content').dataset.name,
          };
        }
      }
    } else {
      this.sibling = null;
    }
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.data.relocate(this.draggedEl, this.sibling);
    this.trello.redrawDOM();
    this.trello.data.saveState();
    this.originalPosition = null;
  }

  onMouseMove(evt) {
    evt.preventDefault();
    if (document.querySelector('[data-id="000000"]')) {
      document.querySelector('[data-id="000000"]').remove();
    }
    if (!this.draggedEl) {
      return;
    }

    this.ghostEl.style.left = `${evt.pageX - this.shiftX}px`;
    this.ghostEl.style.top = `${evt.pageY - this.shiftY}px`;
    this.addGhostEl(evt);
  }

  addGhostEl(evt) {
    this.ghostEl.hidden = true;
    const elemBelow = document.elementFromPoint(evt.clientX, evt.clientY);
    this.ghostEl.hidden = false;
    if (!elemBelow) return;
    
    const target = elemBelow.closest('.col__card');
    const contentContainer = elemBelow.closest('.col__content');
    
    // Проверяем, что мы находимся в контейнере с карточками
    if (!contentContainer) return;
    
    // Получаем все карточки в текущей колонке (исключая поднятую)
    const cardsInColumn = Array.from(contentContainer.querySelectorAll('.col__card')).filter(card => card.dataset.id !== this.id);
    
    // Если в колонке нет других карточек, не показываем placeholder
    if (cardsInColumn.length === 0) return;
    
    // Проверяем, не находимся ли мы над пустым местом, где была поднятая карточка
    const originalPosition = this.getOriginalPosition();
    if (originalPosition && this.isOverOriginalPosition(elemBelow, originalPosition)) {
      return;
    }
    
    this.clone = this.draggedEl.cloneNode(true);
    this.clone.dataset.id = '000000';

    if (elemBelow.closest('.col__content')) {
      if (!elemBelow.closest('.col__content').hasChildNodes()) {
        elemBelow.closest('.col__content').append(this.clone);
      } else if (target && target.dataset.id !== this.id) {
        const { top } = elemBelow.getBoundingClientRect();

        if (target.previousElementSibling && target.previousElementSibling.dataset.id === this.id) {
          elemBelow.closest('.col__content').insertBefore(this.clone, elemBelow.closest('.col__card').nextElementSibling);
        }
        if (target.nextElementSibling && target.nextElementSibling.dataset.id === this.id) {
          elemBelow.closest('.col__content').insertBefore(this.clone, elemBelow.closest('.col__card'));
        }
        if (evt.pageY > window.scrollY + top + elemBelow.closest('.col__card').offsetHeight / 2) {
          elemBelow.closest('.col__content').insertBefore(this.clone, elemBelow.closest('.col__card').nextElementSibling);
        } else {
          elemBelow.closest('.col__content').insertBefore(this.clone, elemBelow.closest('.col__card'));
        }
      } else {
        const down50 = document.elementFromPoint(evt.clientX, evt.clientY + 70);
        const up50 = document.elementFromPoint(evt.clientX, evt.clientY - 50);

        if (down50.closest('.col__footer')) {
          elemBelow.closest('.col__content').append(this.clone);
        } else if (up50.closest('.col__header')) {
          elemBelow.closest('.col__content').prepend(this.clone);
        }
      }
    }

    if (elemBelow.closest('.col__footer')) {
      elemBelow.closest('.trello__col').querySelector('.col__content').scrollTop = elemBelow.closest('.trello__col').querySelector('.col__content').scrollHeight;
      elemBelow.closest('.trello__col').querySelector('.col__content').append(this.clone);
    }
    if (elemBelow.closest('.col__header')) {
      elemBelow.closest('.trello__col').querySelector('.col__content').prepend(this.clone);
    }
  }

  onMouseDown(evt) {
    evt.preventDefault();
    const { classList } = evt.target;
    if (!evt.target.closest('.col__card') || classList.contains('card__delete') || classList.contains('card__subBtn')) {
      return;
    }
    if (evt.target.closest('.col__card')) {
      document.body.style.cursor = 'grabbing';
      this.draggedEl = evt.target.closest('.col__card');
      this.id = this.draggedEl.dataset.id;
      
      // Сохраняем исходную позицию карточки
      this.originalPosition = this.getOriginalPosition();
      
      const coordsDrag = this.draggedEl.getBoundingClientRect();
      this.shiftX = evt.clientX - coordsDrag.left;
      this.shiftY = evt.clientY - coordsDrag.top;
      this.ghostEl = this.draggedEl.cloneNode(true);
      this.ghostEl.classList.add('dragged');
      this.ghostEl.dataset.id = '111111';
      this.draggedEl.classList.add('darkened');
      document.querySelector('.trello__body').append(this.ghostEl);
      this.ghostEl.style.width = `${this.draggedEl.offsetWidth}px`;
      this.ghostEl.style.left = `${coordsDrag.left}px`;
      this.ghostEl.style.top = `${coordsDrag.top}px`;
      this.container.addEventListener('mousemove', this.onMouseMove);
    }
  }

  getOriginalPosition() {
    if (!this.draggedEl) return null;
    
    const container = this.draggedEl.closest('.col__content');
    if (!container) return null;
    
    const cards = Array.from(container.querySelectorAll('.col__card'));
    const index = cards.indexOf(this.draggedEl);
    
    return {
      container: container,
      index: index,
      totalCards: cards.length
    };
  }

  isOverOriginalPosition(elemBelow, originalPosition) {
    if (!originalPosition || !elemBelow) return false;
    
    // Проверяем, что мы в той же колонке
    const currentContainer = elemBelow.closest('.col__content');
    if (currentContainer !== originalPosition.container) return false;
    
    // Если в колонке была только одна карточка, не показываем placeholder
    if (originalPosition.totalCards === 1) return true;
    
    // Проверяем, находимся ли мы в пустом пространстве, где была карточка
    const cards = Array.from(currentContainer.querySelectorAll('.col__card'));
    const currentIndex = this.getCurrentPositionIndex(elemBelow, cards);
    
    // Если мы находимся в позиции, где была поднятая карточка, не показываем placeholder
    return currentIndex === originalPosition.index;
  }

  getCurrentPositionIndex(elemBelow, cards) {
    if (!elemBelow || cards.length === 0) return -1;
    
    const target = elemBelow.closest('.col__card');
    if (target) {
      return cards.indexOf(target);
    }
    
    // Если мы не над карточкой, определяем позицию по координатам
    const container = elemBelow.closest('.col__content');
    if (!container) return -1;
    
    const mouseY = elemBelow.clientY || 0;
    
    for (let i = 0; i < cards.length; i++) {
      const cardRect = cards[i].getBoundingClientRect();
      if (mouseY < cardRect.top + cardRect.height / 2) {
        return i;
      }
    }
    
    return cards.length; // В конец
  }
}
