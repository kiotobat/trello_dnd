export default class Data {
  constructor() {
    this.memory = {
      todo: [],
      progress: [],
      done: [],
    };
    this.drag = null;
  }

  getId() {
    const id = Math.floor(Math.random() * 1000000);
    const arr = [...this.memory.todo, ...this.memory.progress, ...this.memory.done];
    if (arr.find((e) => e.id === id)) {
      return this.getId();
    }
    return id;
  }

  create(prop, text) {
    this.memory[prop].push({ id: this.getId(), text });
  }

  read(id, prop) {
    return this.memory[prop].find((e) => e.id === id);
  }

  delete(id, prop) {
    const idx = this.memory[prop].findIndex((e) => e.id === +id);
    this.memory[prop].splice(idx, 1);
  }

  relocate(dragged, sibling) {
    if (sibling) {
      [this.memory.todo, this.memory.progress, this.memory.done].forEach((column) => {
        if (column.find((e) => e.id === +dragged.dataset.id)) {
          this.drag = column.find((e) => e.id === +dragged.dataset.id);
          const idxDrag = column.findIndex((e) => e.id === this.drag.id);
          column.splice(idxDrag, 1);
          const idxSibling = this.memory[sibling.column].findIndex((e) => e.id === +sibling.id);
          if (sibling.id) {
            this.memory[sibling.column].splice(idxSibling, 0, this.drag);
          } else {
            this.memory[sibling.column].push(this.drag);
          }
        }
      });
    }
  }

  saveState() {
    localStorage.setItem('memory', JSON.stringify(this.memory));
  }

  update() {
    if (localStorage.getItem('memory')) {
      this.memory = JSON.parse(localStorage.getItem('memory'));
    }
  }
}
