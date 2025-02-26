javascript: var curVersion = "250225.1";
var cururl = document.location.href;
var regex_pa = /https:\/\/pal\.assembly\.go\.kr/;
var regex_paId = /[?&]lgsltPaId=([^&]+)/;
var regex_vforkor = /https:\/\/vforkorea\.com\/assem\//;
var isNotIinitial,
  isLogin,
  opinionStr,
  pattern,
  opinionSelCnt,
  opinionPerCnt,
  opinionViewCnt,
  opinionCurStr,
  opinionCurCnt,
  opinionList,
  isIgnoreChk,
  selectAssemble,
  isLawful,
  txt_js,
  txt_cn,
  isAllowAiOp;

// main 함수
var assembleDo = function () {
  // current url이 국회 입법 예고 입법 페이지인 경우
  if (regex_pa.test(cururl)) {
    // 의견 등록 버튼을 찾아 클릭
    var regOp = document.querySelectorAll("ul#cnts-tab-list li a")[2];
    if (regOp.className == "") {
      regOp.click();
    } else {
      // 이미 의견 등록을 눌러놨다면
      // 스크립트 생성
      var pasteBtn = document.createElement("button");
      pasteBtn.classList.add("pasteButton");
      document.body.appendChild(pasteBtn);
      document
        .getElementsByClassName("pasteButton")[0]
        .addEventListener("click", async function () {
          try {
            // 이 스크립트는
            // 현재 선택한 입법 id를 찾아
            // 찬성 반대에 따른 제목과 내용을 입력
            // 보안문자가 입력이 되어있어야함.
            pasteBtn.remove();
            var paId = cururl.match(regex_paId)[1];
            clipboardText = await navigator.clipboard.readText();
            jsonData = JSON.parse(clipboardText);
            txt_js = jsonData.isLawful == 1 ? "찬성" : "반대";
            if (jsonData.isAllowAiOp && aiCmt != undefined) {
              txt_cn =
                "다음과 같은 이유로 " +
                txt_js +
                " 합니다\r\n\r\n" +
                jsonData[paId];
            } else {
              txt_cn =
                jsonData.isLawful == 1
                  ? "선법은 찬성합니다. 대한민국 화이팅!"
                  : "입법독재 절대 반대합니다.";
            }
          } catch (err) {
            txt_js = "반대";
            txt_cn = "입법독재 절대 반대합니다.";
            console.log("error!");
          } finally {
            document.querySelector("#txt_sj").value = txt_js + "합니다.";
            document.querySelector("#txt_cn").value = txt_cn;
            // 보안문자 관련
            const inputField = document.querySelector("#catpchaAnswer");
            if (inputField != undefined) {
              inputField.addEventListener("input", () => {
                const value = inputField.value;
                if (/^\d+$/.test(value) && value.length === 5) {
                  trimAllInputText();
                  if (!validate()) {
                    return 0;
                  }
                  $(".loading_bar").show();
                  checkWebFilter($("#frm"));
                }
              });
              inputField.focus();
            }
          }
        });
      pasteBtn.focus();
      pasteBtn.click();
    }
  } else if (regex_vforkor.test(cururl)) {
    // 현재 사이트가 vforkorea 라면
    // 로그인 하고
    if (!isLogin) {
      isLogin = confirm(
        "국회사이트에 로그인 하시겠습니까?\r\n의견 등록 페이지로 페이지를 열기 때문에 미리 로그인 하셔야 합니다.\r\n확인 시 국회 로그인 사이트로 이동합니다.\r\n\r\n* 해당 스크립트는 국회의견 작성에 복사(Ctrl+C), 붙여넣기(Ctrl+V)를 사용하기에 복사한 내용이 있으면 사용 전 저장하시기 바랍니다.\r\n현재 스크립트 버전 : " +
          curVersion
      );
      if (isLogin) {
        window.open(
          "https://member.assembly.go.kr/login/loginPage.do?procUrl=https://pal.assembly.go.kr/napal/checkLogin.do&returnUrl=https%3A%2F%2Fpal.assembly.go.kr%2Fnapal%2Fmain%2Fmain.do",
          "_blank"
        );
      } else {
        isLogin = 1;
        assembleDo();
      }
    } else {
      if (!isNotIinitial) {
        if (!selectAssemble) {
          // 의견 종류 고르고
          selectAssemble = prompt(
            "어떤 의견을 선택하십니까?\r\n1:위험의견\r\n2:선법의견\r\n*기본 선택 : 위험의견"
          );
          selectAssemble =
            !isNaN(selectAssemble) && selectAssemble != 0 ? selectAssemble : 1;
          if (selectAssemble == 1) {
            opinionStr = "위험의견";
          } else if (selectAssemble == 2) {
            opinionStr = "선법의견";
          } else {
            return 0;
          }
          // 의견 개수 고르고
          opinionSelCnt =
            !isNaN(Number(opinionSelCnt)) && opinionSelCnt != 0
              ? opinionSelCnt
              : 10;
          // 한 번에 열 사이트 개수
          // 너무 많으면 렉이 걸릴 수 있고 tab이 너무 많아짐을 방지
          opinionPerCnt = Number(
            prompt("한번에 열 의견의 개수를 입력하세요\r\n*기본 10")
          );
          if (opinionPerCnt == undefined) {
            return 0;
          }
          opinionPerCnt =
            !isNaN(opinionPerCnt) && opinionPerCnt != 0 ? opinionPerCnt : 10;
        }
        // 모든 예고 입법에 대하여
        // 설정한 법 종류에 따라
        // 체크 박스 체크여부 확인
        // 체크 박스가 체크가 안되있다면 작업 목록에 push
        opinionList = [];
        document.querySelectorAll("tbody#tbody > tr").forEach((tr) => {
          // 법률안+AI요약(참고용) 의 맨 아래 comment를 :queryStr에 저장
          var queryStr = "p.comment";
          if (selectAssemble == 2) {
            queryStr += ".Y";
          } else if (selectAssemble == 1) {
            queryStr += ".N";
          }
          var isSelected = tr.querySelector(queryStr);
          var isChk = tr.querySelector("input[type=checkbox]").checked;
          if (isSelected && (isIgnoreChk || !isChk)) {
            opinionList.push(tr);
          }
        });
        opinionCnt = 0;
        opinionViewCnt = 0;
        isNotIinitial = 1;
      }

      // 새로 띄울 tab의 index
      // 새로 띄울 tab의 마지막 index
      var sCnt = opinionViewCnt * opinionPerCnt;
      var eCnt = (opinionViewCnt + 1) * opinionPerCnt - 1;

      // 아무것도 search 되지 않은 경우 and 이미 진행한 입법도 포함
      if (opinionList.length == 0 && !isIgnoreChk) {
        isIgnoreChk = confirm(
          "선택한 입법안이 없습니다\r\n확인체크 된 입법안도 포함시켜 검색할까요?"
        );
        if (isIgnoreChk) {
          isNotIinitial = 0;
          assembleDo();
        }
      } else {
        // 남은 법안이 10(선택한 한번에 열 사이트 개수)개 미만인 경우
        if (opinionList.length < eCnt + 1) {
          eCnt = opinionList.length - 1;
        }
        // 남은 법안이 없는 경우
        if (opinionList.length <= sCnt) {
          var isResearch = confirm(
            "확인할 입법이 없습니다.\r\n검색 옵션을 다시 선택하시겠습니까?"
          );
          if (isResearch) {
            isNotIinitial = 0;
            selectAssemble = 0;
            isIgnoreChk = 0;
            assembleDo();
          }
          return 0;
        }

        var isOpen = confirm(
          "선택한 입법안이 총" +
            opinionList.length +
            "개 입니다.\r\n" +
            (sCnt + 1) +
            " ~ " +
            (eCnt + 1) +
            "의 입법안을 열겠습니다."
        );
        // ai 사용 여부 확인
        if (isOpen && isAllowAiOp === undefined) {
          isAllowAiOp = confirm(
            "국회 의견등록에 ai 요약본을 사용하시겠습니까?"
          );
        }

        if (isOpen) {
          // 한 사이클 진행
          opinionViewCnt++;
          var queryStr = "p";
          if (selectAssemble == 2) {
            queryStr += ".positive";
            isLawful = 1;
          } else if (selectAssemble == 1) {
            queryStr += ".nagative";
            isLawful = 0;
          }
          var aiCmt = { isLawful: isLawful, isAllowAiOp: isAllowAiOp };
          while (sCnt <= eCnt) {
            op = opinionList[sCnt];
            opChk = op.querySelector("input[type=checkbox]");
            if (!opChk.checked) {
              opChk.click();
            }
            var vlink = document.createElement("a");
            // 새로 창을 여는데
            // 해당 입법 예고 페이지의
            // 의견 등록 창으로 넘어가서
            vlink.target = "_blank";
            vlink.href = op
              .querySelector("p.comment")
              .closest('a[href*="pal.assembly"]')
              .href.replace("lgsltpaOngoing/view.do", "lgsltpaOpn/forInsert.do")
              .replace("lgsltpaOpn/list.do", "lgsltpaOpn/forInsert.do");

            // ai를 쓰는 경우
            if (isAllowAiOp) {
              // ai의 설명을 :aiCmt에 dict 형태로 저장한다.
              var paId = vlink.href.match(regex_paId)[1];
              var opAiCmt = op.querySelector(queryStr);
              aiCmt[paId] = opAiCmt != undefined ? opAiCmt.innerText : null;
            }
            document.body.appendChild(vlink);
            vlink.click();
            vlink.remove();
            sCnt++;
          }
          // 스크립트를 만드는데
          // aiCmt 리스트를 JSON 형태로 직렬화해서 클립보드에 저장
          var copyBtn = document.createElement("button");
          copyBtn.classList.add("copyButton");
          document.body.appendChild(copyBtn);
          document
            .getElementsByClassName("copyButton")[0]
            .addEventListener("click", function () {
              navigator.clipboard.writeText(JSON.stringify(aiCmt, null, 2));
            });
          copyBtn.focus();
          copyBtn.click();
          copyBtn.remove();
        }
      }
    }
    // vforkorea도 입법 예고 사이트도 아닌 경우에 js 실행 시
  } else {
    // vforkorea 사이트로 넘어감
    window.open("https://vforkorea.com/assem/", "_blank");
  }
};

// main 함수 실행
assembleDo();
