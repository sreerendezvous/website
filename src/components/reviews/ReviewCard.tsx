import React from 'react';
import { Star } from 'lucide-react';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-dark-200 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < review.rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
      <p className="text-gray-300 mb-4">{review.comment}</p>
      <div className="text-sm text-gray-400">
        {new Date(review.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}