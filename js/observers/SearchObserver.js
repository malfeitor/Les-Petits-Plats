export class SearchObserver {
  constructor (data) {
    this._tagsDOM = document.querySelector(`#${data.tags}`)
    this._counterDOM = document.querySelector(`#${data.counter}`)
    this._searchbarDOM = document.querySelector(`#${data.searchbar}`)
    this._tagsList = new Map()
    this._tagsList.set('ingredients', new Set())
    this._tagsList.set('appliance', new Set())
    this._tagsList.set('ustensils', new Set())
    this._recipesList = data.recipes
    this._hiddenRecipes = []
    this._shownRecipes = this._recipesList
    this.filters = data.filters
    this._searchLength = 0
  }

  searchByTag (text, type, working) {
    working = working
      .filter(elem => {
        if (type !== 'appliance') {
          return !elem[type]
            .map(e => e.ingredient !== undefined ? e.ingredient.toLowerCase() : e.toLowerCase())
            .includes(text.toLowerCase())
        } else {
          return !elem.appliance.toLowerCase().includes(text.toLowerCase())
        }
      })
    working.forEach(elem => {
      elem.DOM.classList.add('hidden')
      this._hiddenRecipes.push(elem)
    })
    return working
  }

  fire (text, type = 'bar') {
    let working = []
    const startTime = Date.now()
    switch (type) {
      case 'bar':
        if (this._searchLength > text.length) this.fire('', 'refresh')
        this._searchLength = text.length
        working = [...this._shownRecipes]
        working.filter(item => !item.name.includes(text) &&
          !item.description.includes(text) &&
          !item.ingredients.some(ing => ing.ingredient.includes(text)))
          .forEach(item => {
            item.DOM.classList.add('hidden')
            this._hiddenRecipes.push(item)
          })
        break
      case 'ingredients':
      case 'ustensils':
      case 'appliance':
        this._tagsList.get(type).add(text)
        working = [...this._shownRecipes]
        working = this.searchByTag(text, type, working)
        break
      case 'refresh':
        this._hiddenRecipes = []
        this._searchLength = this._searchbarDOM.value.length
        working = [...this._recipesList]
        for (const ele of this._tagsList) {
          if (ele[1].has(text)) ele[1].delete(text)
          for (const tag of [...ele[1].values()]) {
            working = this.searchByTag(tag, ele[0], working)
          }
        }
        break
      default:
        throw new Error('Error : search type not know.')
    }
    this._shownRecipes = this._recipesList.filter(elem => !this._hiddenRecipes.includes(elem))
    this._shownRecipes.map(recipe => recipe.DOM.classList.remove('hidden'))
    if (type === 'refresh') this.fire(this._searchbarDOM.value)
    this._counterDOM.textContent = this._shownRecipes.length
    this._counterDOM.textContent += this._shownRecipes.length !== 1 ? ' recettes' : ' recette'
    this.filters.forEach(filt => {
      filt.clearList()
      this._shownRecipes.forEach(recipe => filt.availItem(recipe[filt.type]))
    })
    if (this._shownRecipes.length === 0) {
      document.querySelector('#no-recipes').classList.remove('hidden')
      document.querySelector('#no-recipes-search').textContent = text
    } else {
      document.querySelector('#no-recipes').classList.add('hidden')
    }
    const endTime = Date.now()
    console.log(`Durée de la recherche : ${String(endTime - startTime)}ms`)
  }
}
