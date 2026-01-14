import React, { useState } from "react";
import TextInput from "../TextInput";
import Textarea from "../Textarea";
import PartButton from "./PartButton";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";

const CustomFields = ({ onChange = () => {} }) => {
  const [sections, setSections] = useState([
    {
      sku: Date.now(),
      label: "",
      fields: [{ sku: Date.now() + 1, key: "", value: "" }],
    },
  ]);

  const updateSections = (updated) => {
    setSections(updated);
    onChange(updated);
  };

  // Add new Section (Battery, Display, etc.)
  const addSection = () => {
    updateSections([
      ...sections,
      { sku: Date.now(), label: "", fields: [] },
    ]);
  };

  const removeSection = (sku) => {
    updateSections(sections.filter((sec) => sec.sku !== sku));
  };

  const updateSectionLabel = (sku, newLabel) => {
    updateSections(
      sections.map((sec) =>
        sec.sku === sku ? { ...sec, label: newLabel } : sec
      )
    );
  };

  // Manage child fields inside section
  const addField = (sectionSku) => {
    updateSections(
      sections.map((sec) =>
        sec.sku === sectionSku
          ? {
              ...sec,
              fields: [...sec.fields, { sku: Date.now(), key: "", value: "" }],
            }
          : sec
      )
    );
  };

  const updateField = (sectionSku, fieldSku, name, newValue) => {
    updateSections(
      sections.map((sec) =>
        sec.sku === sectionSku
          ? {
              ...sec,
              fields: sec.fields.map((f) =>
                f.sku === fieldSku ? { ...f, [name]: newValue } : f
              ),
            }
          : sec
      )
    );
  };

  const removeField = (sectionSku, fieldSku) => {
    updateSections(
      sections.map((sec) =>
        sec.sku === sectionSku
          ? { ...sec, fields: sec.fields.filter((f) => f.sku !== fieldSku) }
          : sec
      )
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.sku} className="border border-res p-4 rounded-lg ">
          {/* Label input */}
          <div className="flex items-center justify-between mb-3">
            <TextInput
              value={section.label}
              onChange={(e) => updateSectionLabel(section.sku, e.target.value)}
              placeholder="Main Label (e.g. Battery, Display)"
              className="w-3/4"
            />
            <PartButton onClick={() => removeSection(section.sku)} className="w-10 h-10 !p-0">
              <RiSubtractLine />
            </PartButton>
          </div>

          {/* Child Fields */}
          {section.fields.map((field) => (
            <div key={field.sku} className="flex justify-between gap-2 mb-2">
              <TextInput
                value={field.key}
                onChange={(e) =>
                  updateField(section.sku, field.sku, "key", e.target.value)
                }
                placeholder="Key (e.g. Capacity)"
                className="w-1/5 bg-transparent h-10"
              />
              <Textarea
                value={field.value}
                onChange={(e) =>
                  updateField(section.sku, field.sku, "value", e.target.value)
                }
                placeholder="Value (e.g. 5000mAh)"
                className="w-2/3 bg-transparent "
              />
              <PartButton
                onClick={() => removeField(section.sku, field.sku)}
                className="w-10 h-10 !p-0"
              >
                <RiSubtractLine />
              </PartButton>
            </div>
          ))}

          <PartButton onClick={() => addField(section.sku)} className="mt-2 size-8 !p-0">
            <RiAddLine />
          </PartButton>
        </div>
      ))}

      {/* Add new section */}
      <PartButton onClick={addSection} className="mt-4 size-10 !p-0">
        <RiAddLine />
      </PartButton>
    </div>
  );
};

export default CustomFields;