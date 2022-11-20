import React, { useContext, useEffect, useRef } from "react";
import { DataContext } from "scorecard-types";
import Chip from "./Chip";
import { motion } from "framer-motion";

export default function GradingCategorySelector(props: {
  editingGradingCategory: boolean;
  setEditingGradingCategory: (editingGradingCategory: boolean) => void;
}) {
  const data = useContext(DataContext);

  const { editingGradingCategory, setEditingGradingCategory } = props;

  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    const handleClick = (e: any) => {
      if (e.target == null || !ref.current?.contains(e.target)) {
        setEditingGradingCategory(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.div
      className="fixed h-full top-0 right-0 bg-white/90 shadow-sm bottom-0 z-30"
      animate={{
        width: editingGradingCategory ? "50%" : "0%",
      }}
      ref={ref}
      transition={{
        duration: 0.3,
      }}
    >
      <div className="pl-4 py-4 flex flex-col gap-2">
        {data.data?.gradeCategoryNames.map((name, index) => (
          <Chip
            rightAlign={true}
            key={index}
            highlighted={index === data.gradeCategory}
            onClick={() => {
              data.setGradeCategory(index);
              props.setEditingGradingCategory(false);
            }}
          >
            {name}
          </Chip>
        ))}
      </div>
    </motion.div>
  );
}
