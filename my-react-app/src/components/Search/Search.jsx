import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Search.css";
import api from "../../services/api";
import downArrow from "../../assets/images/icon/downArrow.svg";
import MetroMap from "../MetroMap/MetroMap";

function Search() {
  const navigate = useNavigate();
  const [startStationValue, setStartStationValue] = useState("");
  const [endStationValue, setEndStationValue] = useState("");
  const [stations, setStations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showStartList, setShowStartList] = useState(false);
  const [showEndList, setShowEndList] = useState(false);
  const [selectedOption, setSelectedOption] = useState("전체 ");
  const [showOptions, setShowOptions] = useState(false);
  const options = ["전체 ", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  // 초성 검색 기능 정규식 변수 설정
  const reESC = /[\\^$.*+?()[\]{}|]/g;
  const reChar = /[가-힣]/;
  const reJa = /[ㄱ-ㅎ]/;
  const offset = 44032;

  const orderOffset = [
    ["ㄱ", 44032],
    ["ㄲ", 44620],
    ["ㄴ", 45208],
    ["ㄷ", 45796],
    ["ㄸ", 46384],
    ["ㄹ", 46972],
    ["ㅁ", 47560],
    ["ㅂ", 48148],
    ["ㅃ", 48736],
    ["ㅅ", 49324],
  ];

  const con2syl = Object.fromEntries(orderOffset);

  const pattern = (ch) => {
    let r;
    if (reJa.test(ch)) {
      const begin =
        con2syl[ch] || (ch.charCodeAt(0) - 12613) * 588 + con2syl["ㅅ"];
      const end = begin + 587;
      r = `[${ch}\\u${begin.toString(16)}-\\u${end.toString(16)}]`;
    } else if (reChar.test(ch)) {
      const chCode = ch.charCodeAt(0) - offset;
      if (chCode % 28 > 0) return ch;
      const begin = Math.floor(chCode / 28) * 28 + offset;
      const end = begin + 27;
      r = `[\\u${begin.toString(16)}-\\u${end.toString(16)}]`;
    } else r = ch.replace(reESC, "\\$&");
    return `(${r})`;
  };

  const initialMatch = (query, target) => {
    const reg = new RegExp(query.split("").map(pattern).join(".*?"), "i");
    const matches = reg.exec(target);
    return Boolean(matches);
  };

  const startSearched =
    startStationValue.length >= 1
      ? stations.filter(
          (station) =>
            station.includes(startStationValue) ||
            initialMatch(startStationValue, station)
        )
      : [];

  const endSearched =
    endStationValue.length >= 1
      ? stations.filter(
          (station) =>
            station.includes(endStationValue) ||
            initialMatch(endStationValue, station)
        )
      : [];

  const startResultClick = (selectedStation) => {
    setStartStationValue(selectedStation);
    setShowStartList(false);
  };

  const endResultClick = (selectedStation) => {
    setEndStationValue(selectedStation);
    setShowEndList(false);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowOptions(false);
  };

  const searchBtnClick = (event) => {
    event.preventDefault();
    if (
      selectedOption === "전체 " &&
      stations.includes(startStationValue) &&
      stations.includes(endStationValue)
    ) {
      navigate(
        `/cars?startStation=${startStationValue}&endStation=${endStationValue}`
      );
    } else if (
      selectedOption !== "전체 " &&
      stations.includes(startStationValue) &&
      stations.includes(endStationValue)
    ) {
      navigate(
        `/cars/info?startStation=${startStationValue}&endStation=${endStationValue}&carNumber=${selectedOption}`
      );
    } else if (!stations.includes(startStationValue)) {
      alert("출발역이 잘못 입력되었습니다!");
    } else if (!stations.includes(endStationValue)) {
      alert("도착역이 잘못 입력되었습니다!");
    }
  };

  useEffect(() => {
    api
      .get("/stations")
      .then((response) => {
        setStations(Object.values(response.data));
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    api
      .get("/stations/recent-routes")
      .then((response) => {
        setSearchHistory(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, []);

  return (
    <div className="Search">
      <form
        action="/cars"
        method="GET"
        id="stationSearchForm"
        autocomplete="off"
      >
        <div className="inputBox">
          <input
            type="text"
            name="startStation"
            id="startStationInput"
            value={startStationValue}
            onChange={(event) => setStartStationValue(event.target.value)}
            onClick={() => {
              setShowStartList(true);
              setShowOptions(false);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowStartList(false);
              }, 200);
            }}
            placeholder="출발역"
            required
          ></input>
          <input
            type="text"
            name="endStation"
            id="endStationInput"
            value={endStationValue}
            onChange={(event) => setEndStationValue(event.target.value)}
            onClick={() => {
              setShowEndList(true);
              setShowOptions(false);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowEndList(false);
              }, 200);
            }}
            placeholder="도착역"
            required
          ></input>
        </div>
        {showStartList && startSearched.length === 0 && (
          <div className="searchResultList">
            {searchHistory.map((item, index) => (
              <li
                className="startResult"
                key={index + item}
                onClick={() => {
                  startResultClick(item.startStation);
                  endResultClick(item.endStation);
                }}
              >
                {item.startStation}&nbsp;&rarr;&nbsp;
                {item.endStation}
              </li>
            ))}
          </div>
        )}
        {showStartList && startSearched.length >= 1 && (
          <div className="searchResultList">
            {startSearched.map((item, index) => (
              <li
                className="startResult"
                key={index + item}
                onClick={() => startResultClick(item)}
              >
                {item}
              </li>
            ))}
          </div>
        )}
        {showEndList && endSearched.length === 0 && (
          <div className="searchResultList">
            {searchHistory.map((item, index) => (
              <li
                className="endResult"
                key={index + item}
                onClick={() => {
                  startResultClick(item.startStation);
                  endResultClick(item.endStation);
                }}
              >
                {item.startStation}&nbsp;&rarr;&nbsp;
                {item.endStation}
              </li>
            ))}
          </div>
        )}
        {showEndList && endSearched.length >= 1 && (
          <div className="searchResultList">
            {endSearched.map((item, index) => (
              <li
                className="endResult"
                key={index + item}
                onClick={() => endResultClick(item)}
              >
                {item}
              </li>
            ))}
          </div>
        )}
        <div className="carNumber" name="carNumber">
          <input type="hidden" name="carNumber" value={selectedOption} />
          <div
            className="selectedOption"
            onClick={() => {
              setShowOptions(!showOptions);
            }}
            value={selectedOption}
          >
            <div>{selectedOption}호차</div>
            <div>
              <img src={downArrow} alt="아래방향아이콘" />
            </div>
          </div>
        </div>
        {showOptions && (
          <div className="dropdownOptions">
            {options.map((option, index) => (
              <li key={index} onClick={() => handleOptionClick(option)}>
                {option}호차
              </li>
            ))}
          </div>
        )}
        <button className="searchBtn" onClick={searchBtnClick}>
          검색하기
        </button>
        <MetroMap
          startResultClick={startResultClick}
          endResultClick={endResultClick}
        />
      </form>
    </div>
  );
}

export default Search;
