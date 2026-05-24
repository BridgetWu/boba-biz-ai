import { useState, useRef, ChangeEvent } from "react";
import type { MenuItem } from "./types";

interface EditableMenuItemProps {
  item: MenuItem;
  onUpdate: (updatedItem: MenuItem) => void;
}

export function EditableMenuItem({ item, onUpdate }: EditableMenuItemProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState(item.name);
  const [priceValue, setPriceValue] = useState(item.price);
  const [descriptionValue, setDescriptionValue] = useState(item.description);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameClick = () => {
    setEditingName(true);
    setNameValue(item.name);
  };

  const handlePriceClick = () => {
    setEditingPrice(true);
    setPriceValue(item.price);
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameValue.trim() !== item.name) {
      onUpdate({ ...item, name: nameValue.trim() });
    }
  };

  const handlePriceBlur = () => {
    setEditingPrice(false);
    if (priceValue.trim() !== item.price) {
      onUpdate({ ...item, price: priceValue.trim() });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNameBlur();
    } else if (e.key === "Escape") {
      setEditingName(false);
      setNameValue(item.name);
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePriceBlur();
    } else if (e.key === "Escape") {
      setEditingPrice(false);
      setPriceValue(item.price);
    }
  };

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only valid currency format: $, digits, and decimal point
    if (/^\$?\d*\.?\d{0,2}$/.test(value)) {
      setPriceValue(value);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleDescriptionClick = () => {
    setEditingDescription(true);
    setDescriptionValue(item.description);
  };

  const handleDescriptionBlur = () => {
    setEditingDescription(false);
    if (descriptionValue.trim() !== item.description) {
      onUpdate({ ...item, description: descriptionValue.trim() });
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditingDescription(false);
      setDescriptionValue(item.description);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...item, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onUpdate({ ...item, image: undefined });
  };

  return (
    <li className="tsp__menuItem">
      <div className="tsp__menuImageContainer">
        {item.image ? (
          <div className="tsp__menuImageWrapper">
            <img
              src={item.image}
              alt={item.name}
              className="tsp__menuImage"
              onClick={handleImageClick}
            />
            <button
              type="button"
              className="tsp__menuImageRemove"
              onClick={handleRemoveImage}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="tsp__menuImagePlaceholder"
            onClick={handleImageClick}
            aria-label="Add image"
          >
            <span className="tsp__menuImageIcon">+</span>
            <span className="tsp__menuImageText">Add image</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="tsp__menuImageInput"
          aria-hidden
        />
      </div>
      <div className="tsp__menuTop">
        {editingName ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="tsp__menuNameInput"
            autoFocus
          />
        ) : (
          <span
            className="tsp__menuName tsp__menuName--editable"
            onClick={handleNameClick}
            title="Click to edit"
          >
            {item.name}
          </span>
        )}
        {editingPrice ? (
          <input
            type="text"
            value={priceValue}
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            onKeyDown={handlePriceKeyDown}
            className="tsp__menuPriceInput"
            autoFocus
          />
        ) : (
          <span
            className="tsp__menuPrice tsp__menuPrice--editable"
            onClick={handlePriceClick}
            title="Click to edit"
          >
            {item.price}
          </span>
        )}
      </div>
      {editingDescription ? (
        <textarea
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          className="tsp__menuDescInput"
          autoFocus
        />
      ) : (
        <p
          className="tsp__menuDesc tsp__menuDesc--editable"
          onClick={handleDescriptionClick}
          title="Click to edit"
        >
          {item.description}
        </p>
      )}
    </li>
  );
}
