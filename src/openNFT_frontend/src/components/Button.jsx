import React from 'react'

const Button = (props) => {
  return (
    <div className='Chip-root makeStyles-chipBlue-108 Chip-clickable'>
        <span className='form-Chip-label' onClick={props.handleClick}>
            {props.text}
        </span>
    </div>
  )
}

export default Button