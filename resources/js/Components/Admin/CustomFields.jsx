import React, { useEffect, useState } from "react";
import TextInput from "../TextInput";
import Textarea from "../Textarea";
import PartButton from "./PartButton";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import { textarea } from "@/Utils/classes";

const CustomFields = ({ onChange = () => {},  value = [] }) => {
  const [fields, setFields] = useState([
    { sku: Date.now(), key: "", value: "" },
  ]);
  useEffect(() => {
    if (!Array.isArray(value)) return;
  setFields(value);
  }, [value]);
  const updateFields = (updated) => {
    setFields(updated);
    onChange(updated);
  };

  // Add Field
  const addField = () => {
    updateFields([
      ...fields,
      { sku: Date.now(), key: "", value: "" },
    ]);
  };

  // Update Field
  const updateField = (sku, name, value) => {
    updateFields(
      fields.map((f) =>
        f.sku === sku ? { ...f, [name]: value } : f
      )
    );
  };

  // Remove Field
  const removeField = (sku) => {
    updateFields(fields.filter((f) => f.sku !== sku));
  };

  return (
    <div className="flex flex-col gap-4">

      {fields.map((field) => (
        <div key={field.sku} className="flex gap-2">

          <TextInput
            value={field.key}
            onChange={(e) =>
              updateField(field.sku, "key", e.target.value)
            }
            placeholder="Key (e.g. Capacity)"
            className="max-w-1/4 bg-transparent h-10"
          />

          <Textarea
            value={field.value}
            onChange={(e) =>
              updateField(field.sku, "value", e.target.value)
            }
            placeholder="Value (e.g. 5000mAh)"
            className={`w-2/3 bg-transparent ${textarea}`}
          />

          <PartButton
            onClick={() => removeField(field.sku)}
            className="w-10 h-10 !p-0"
          >
            <RiSubtractLine />
          </PartButton>

        </div>
      ))}

      {/* Add Button */}
      <PartButton onClick={addField} className="mt-2 size-10 !p-0">
        <RiAddLine />
      </PartButton>

    </div>
  );
};

export default CustomFields;