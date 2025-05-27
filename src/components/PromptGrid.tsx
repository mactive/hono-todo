import React from 'react';
import { Prompt } from '../types';

interface PromptGridProps {
  prompts: Prompt[];
}

const PromptGrid: React.FC<PromptGridProps> = ({ prompts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          {prompt.file_url && (
            <div className="aspect-w-16 aspect-h-9">
              {prompt.file_type?.startsWith('image/') ? (
                <img
                  src={prompt.file_url}
                  alt={prompt.prompt_text}
                  className="w-full h-full object-cover"
                />
              ) : prompt.file_type?.startsWith('video/') ? (
                <video
                  src={prompt.file_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          )}
          <div className="p-4">
            <p className="text-gray-800 text-sm mb-2">{prompt.prompt_text}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{prompt.author}</span>
              <span>{prompt.category}</span>
            </div>
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export { PromptGrid }; 