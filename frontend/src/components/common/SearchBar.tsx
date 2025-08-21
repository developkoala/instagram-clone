import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { userService } from '../../services/user.service';
import { useDebounce } from '../../hooks/useDebounce';
import { getImageUrl } from '../../utils/imageUrl';

interface SearchResult {
  id: string;
  username: string;
  full_name?: string;
  profile_picture: string;
  bio: string;
  followers_count: number;
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await userService.searchUsers(debouncedQuery);
        setResults(response.users);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-instagram-gray pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="계정 검색"
          className="w-64 pl-10 pr-8 py-2 bg-instagram-lightGray rounded-lg focus:outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-instagram-gray hover:text-black"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-instagram-border max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-instagram-gray">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-instagram-accent"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.username}`}
                  onClick={handleResultClick}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 mr-3">
                    {user.profile_picture ? (
                      <img
                        src={getImageUrl(user.profile_picture) || ''}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-instagram-lightGray flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-500">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.username}</p>
                    <p className="text-sm text-instagram-gray truncate">
                      {user.full_name || 'Instagram 사용자'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-instagram-gray">
              계정을 찾을 수 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;