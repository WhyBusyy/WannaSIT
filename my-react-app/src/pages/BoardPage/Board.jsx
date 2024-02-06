import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Board.css";
import HamHeader from "../../components/Header/HamHeader";
import write from "../../assets/images/icon/write.svg";
import strokeLikeGray from "../../assets/images/icon/strokeLikeGray.svg";

function Board() {
  const [posts, setPosts] = useState([]);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchPosts = (pageNum, title = '') => {
    setIsLoading(true);
    api.get(`/posts?pageNum=${pageNum}&title=${title}`)
      .then(({ data }) => {
        const { data: responseData, totalPageCount } = data;
        if (pageNum === 1) {
          setPosts(responseData);
          setTotalPages(totalPageCount);
        } else {
          setPosts(prevPosts => [...prevPosts, ...responseData]);
        }
      })
      .catch((error) => {
        console.error('에러:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  useEffect(() => {
    fetchPosts(pageNum, searchQuery);
  }, [pageNum, searchQuery]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    // 검색어가 변경될 때 페이지 번호를 1로 초기화
    setPageNum(1);
  };

  useEffect(() => {
    const boardCont = document.querySelector('.boardCont');
    const handleScroll = () => {
      // boardCont 요소의 현재 수직 스크롤 위치
      const scrollTop = boardCont.scrollTop;
      console.log('현재스크롤위치:',scrollTop)
      // 스크롤 가능한 콘텐츠 총 높이 boardCont 전체 총 높이 가려진 것 포함
      // const scrollHeight = boardCont.scrollHeight;
      // boardCont 요소 내의 보이는 콘텐츠 영역 높이
      const clientHeight = boardCont.clientHeight;
      console.log('내용보이는높이:',clientHeight);
      // 총 스크롤 높이 빼기 10픽셀
      const targetScrollPosition = clientHeight * 0.1;
      console.log('이벤트되는지점:',targetScrollPosition);

      if (scrollTop + clientHeight >= targetScrollPosition) {
        if (!isLoading && pageNum < totalPages) {
          setPageNum(pageNum + 1);
        }
      }
    };

    boardCont.addEventListener('scroll', handleScroll);

    return () => {
      boardCont.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading, pageNum, searchQuery]);


  return (
    <div className='Board'>
      <HamHeader />
      <div className='writeIcon'>
        <img src={write} onClick={() => navigate('/boards/write')} alt='글쓰기 아이콘' />
      </div>
      <div className="inputWrap">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="게시글 제목 검색"
        />
      </div>
      <div className="boardContWrap">
        <div className="boardCont">
          {posts.map(post => (
            <div className="boardListWrap" key={post.id}>
              <ul onClick={() => navigate(`/boards/${post.id}`)}>
                <li>{post.username}</li>
                <li>{post.title}</li>
                <li>{post.content}</li>
              </ul>
              <div className="boardLike">
                <img src={strokeLikeGray} alt="좋아요" />
                {post.like_count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Board;