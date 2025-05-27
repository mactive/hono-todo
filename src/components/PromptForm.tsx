import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Prompt } from '../types';

interface PromptFormProps {
  onSubmit: (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

interface UploadResponse {
  url: string;
  type: string;
}

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    prompt_text: '',
    author: '',
    category: '',
    tags: '',
    file: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let fileUrl = '';
      let fileType = '';

      if (formData.file) {
        const formDataObj = new FormData();
        formDataObj.append('file', formData.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const data = await response.json() as UploadResponse;
        fileUrl = data.url;
        fileType = data.type;
      }

      await onSubmit({
        prompt_text: formData.prompt_text,
        author: formData.author,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        file_url: fileUrl || undefined,
        file_type: fileType || undefined,
      });

      // 重置表单
      setFormData({
        prompt_text: '',
        author: '',
        category: '',
        tags: '',
        file: null,
      });
    } catch (error) {
      console.error('Error submitting prompt:', error);
      alert('提交失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
      <div>
        <label htmlFor="prompt_text" className="block text-sm font-medium text-gray-700">
          Prompt 文本
        </label>
        <textarea
          id="prompt_text"
          name="prompt_text"
          value={formData.prompt_text}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="author" className="block text-sm font-medium text-gray-700">
          作者
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          分类
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          标签 (用逗号分隔)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          上传文件
        </label>
        <input
          type="file"
          id="file"
          name="file"
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="mt-1 block w-full"
        />
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isUploading ? '上传中...' : '提交'}
      </button>
    </form>
  );
};

export { PromptForm }; 