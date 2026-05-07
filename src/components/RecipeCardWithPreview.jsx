import { useState } from 'react'
import '../App.css'

function RecipeCardWithPreview({ recipe, onFavoriteClick, renderDifficulty, favIcon, showNotification, isBasicCard = false }) {
  const [hoveredCard, setHoveredCard] = useState(false)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (e) => {
    setHoveredCard(true)
    updatePreviewPosition(e)
  }

  const handleMouseMove = (e) => {
    updatePreviewPosition(e)
  }

  const updatePreviewPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    })
  }

  const handleMouseLeave = () => {
    setHoveredCard(false)
  }

  const imageUrl = isBasicCard ? recipe.img : (recipe.image_url || getDefaultImage(recipe.title))
  const recipeUrl = `/recipe?id=${recipe.id}`

  function getDefaultImage(title) {
    const imageMap = {
      'КАРТОШКА В МУНДИРЕ': '/assets/catalog/в мундире.png',
      'КАРТОШКА ФРИ': '/assets/catalog/фри.png',
      'КАРТОФЕЛЬНОЕ ПЮРЕ': '/assets/catalog/пюре.png',
      // Добавь другие если нужно
    }
    return imageMap[title] || '/assets/default.png' // Или какая-то дефолтная картинка
  }

  return (
    <>
      <a 
        href={recipeUrl}
        style={{ textDecoration: 'none' }} 
        key={recipe.id}
        className="recipe-card-wrapper"
      >
        <div 
          className="recipe-card"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="recipe-card-img">
            <img src={imageUrl} alt={recipe.title} />
          </div>
          <div className="recipe-card-body">
            <h3 className="recipe-card-title">{recipe.title}</h3>
            <p className="recipe-card-author">{recipe.author || 'Ильина Анна'}</p>
            <div className="recipe-card-footer">
              <div className="recipe-difficulty">{renderDifficulty(recipe.difficulty || 1)}</div>
              <button 
                className="recipe-fav" 
                type="button" 
                aria-label="Добавить в избранное"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (onFavoriteClick) {
                    onFavoriteClick(recipe.id, recipe.title, e)
                  }
                }}
              >
                <img src={favIcon} alt="Избранное" />
              </button>
            </div>
          </div>
        </div>
      </a>

      {hoveredCard && (
        <div className="recipe-image-preview" style={{
          left: `${previewPosition.x}px`,
          top: `${previewPosition.y - 20}px`
        }}>
          <img src={imageUrl} alt={recipe.title} />
          <div className="recipe-preview-title">{recipe.title}</div>
        </div>
      )}
    </>
  )
}

export default RecipeCardWithPreview
