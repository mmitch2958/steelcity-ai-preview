"""
Media Sourcer
Pulls stock images and videos from Unsplash and Pexels APIs.
"""

import os
import requests
from typing import Dict, List, Optional
from datetime import datetime


class ImageSourcer:
    """Sources stock images from Unsplash and Pexels."""
    
    UNSPLASH_API = "https://unsplash.com/napi/search/photos"
    PEXELS_API = "https://api.pexels.com/v1/search"
    
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    }
    
    def __init__(self, pexels_api_key: Optional[str] = None):
        self.pexels_api_key = pexels_api_key or os.environ.get("PEXELS_API_KEY")
    
    def search_unsplash(self, query: str, count: int = 5) -> List[Dict]:
        """Search Unsplash for images (no API key needed)."""
        
        try:
            params = {
                "query": query,
                "per_page": count,
                "content_filter": "high"
            }
            
            response = requests.get(
                self.UNSPLASH_API,
                params=params,
                headers=self.HEADERS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for photo in data.get("results", [])[:count]:
                    results.append({
                        "source": "unsplash",
                        "id": photo.get("id"),
                        "description": photo.get("description") or photo.get("alt_description", ""),
                        "urls": {
                            "full": photo.get("urls", {}).get("full"),
                            "regular": photo.get("urls", {}).get("regular"),
                            "small": photo.get("urls", {}).get("small"),
                            "thumb": photo.get("urls", {}).get("thumb")
                        },
                        "photographer": photo.get("user", {}).get("name"),
                        "photographer_url": photo.get("user", {}).get("links", {}).get("html"),
                        "width": photo.get("width"),
                        "height": photo.get("height"),
                        "color": photo.get("color")
                    })
                
                return results
                
        except Exception as e:
            print(f"Unsplash error: {e}")
        
        return []
    
    def search_pexels(self, query: str, count: int = 5) -> List[Dict]:
        """Search Pexels for images (API key required)."""
        
        if not self.pexels_api_key:
            return []
        
        try:
            headers = {
                "Authorization": self.pexels_api_key,
                **self.HEADERS
            }
            
            params = {
                "query": query,
                "per_page": count
            }
            
            response = requests.get(
                self.PEXELS_API,
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for photo in data.get("photos", [])[:count]:
                    results.append({
                        "source": "pexels",
                        "id": photo.get("id"),
                        "description": photo.get("alt", ""),
                        "urls": {
                            "original": photo.get("src", {}).get("original"),
                            "large": photo.get("src", {}).get("large"),
                            "medium": photo.get("src", {}).get("medium"),
                            "small": photo.get("src", {}).get("small")
                        },
                        "photographer": photo.get("photographer"),
                        "photographer_url": photo.get("photographer_url"),
                        "width": photo.get("width"),
                        "height": photo.get("height"),
                        "color": photo.get("avg_color")
                    })
                
                return results
                
        except Exception as e:
            print(f"Pexels error: {e}")
        
        return []
    
    def search(self, query: str, count: int = 10) -> Dict:
        """Search all sources for images."""
        
        all_images = []
        
        # Search Unsplash
        unsplash_results = self.search_unsplash(query, count=count // 2 + 1)
        all_images.extend(unsplash_results)
        
        # Search Pexels
        pexels_results = self.search_pexels(query, count=count // 2 + 1)
        all_images.extend(pexels_results)
        
        # Dedupe
        seen_ids = set()
        unique_images = []
        for img in all_images:
            img_id = f"{img['source']}_{img['id']}"
            if img_id not in seen_ids:
                seen_ids.add(img_id)
                unique_images.append(img)
        
        return {
            "meta": {
                "query": query,
                "generated_at": datetime.now().isoformat(),
                "total_found": len(unique_images)
            },
            "images": unique_images[:count],
            "attribution_required": True
        }
    
    def download(self, url: str, filepath: str) -> bool:
        """Download an image to disk."""
        
        try:
            response = requests.get(url, headers=self.HEADERS, timeout=30, stream=True)
            
            if response.status_code == 200:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                return True
                
        except Exception as e:
            print(f"Download error: {e}")
        
        return False


class VideoSourcer:
    """Sources stock videos from Pexels."""
    
    PEXELS_VIDEO_API = "https://api.pexels.com/videos/search"
    
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    }
    
    def __init__(self, pexels_api_key: Optional[str] = None):
        self.pexels_api_key = pexels_api_key or os.environ.get("PEXELS_API_KEY")
    
    def search(self, query: str, count: int = 5, orientation: str = None) -> Dict:
        """Search Pexels for videos."""
        
        if not self.pexels_api_key:
            return {
                "meta": {"error": "PEXELS_API_KEY required for video search"},
                "videos": []
            }
        
        try:
            headers = {
                "Authorization": self.pexels_api_key,
                **self.HEADERS
            }
            
            params = {
                "query": query,
                "per_page": count,
                "size": "medium"
            }
            
            if orientation:
                params["orientation"] = orientation
            
            response = requests.get(
                self.PEXELS_VIDEO_API,
                params=params,
                headers=headers,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for video in data.get("videos", [])[:count]:
                    video_files = video.get("video_files", [])
                    
                    # Get best quality
                    hd_file = None
                    sd_file = None
                    for vf in video_files:
                        quality = vf.get("quality", "").lower()
                        if quality == "hd" and not hd_file:
                            hd_file = vf
                        elif quality == "sd" and not sd_file:
                            sd_file = vf
                    
                    best_file = hd_file or sd_file or (video_files[0] if video_files else None)
                    
                    if best_file:
                        results.append({
                            "source": "pexels",
                            "id": video.get("id"),
                            "url": video.get("url"),
                            "duration": video.get("duration"),
                            "width": video.get("width"),
                            "height": video.get("height"),
                            "video_url": best_file.get("link"),
                            "quality": best_file.get("quality"),
                            "user": video.get("user", {}).get("name"),
                            "thumbnails": [p.get("picture") for p in video.get("video_pictures", [])[:3]]
                        })
                
                return {
                    "meta": {
                        "query": query,
                        "generated_at": datetime.now().isoformat(),
                        "total_found": len(results)
                    },
                    "videos": results,
                    "attribution_required": True
                }
                
        except Exception as e:
            print(f"Pexels video error: {e}")
        
        return {"meta": {"error": str(e)}, "videos": []}
    
    def download(self, url: str, filepath: str) -> bool:
        """Download a video to disk."""
        
        try:
            response = requests.get(url, headers=self.HEADERS, timeout=120, stream=True)
            
            if response.status_code == 200:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                return True
                
        except Exception as e:
            print(f"Download error: {e}")
        
        return False
