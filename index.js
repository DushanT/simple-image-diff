// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
  "image/apng",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
  "image/x-icon"
];

function validFileType(file) {
  return fileTypes.includes(file.type);
}

function returnFileSize(number) {
  if (number < 1024) {
    return number + 'bytes';
  } else if (number >= 1024 && number < 1048576) {
    return (number / 1024).toFixed(1) + 'KB';
  } else if (number >= 1048576) {
    return (number / 1048576).toFixed(1) + 'MB';
  }
}

function updateImageDisplay(preview, input, postfix) {
  while (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }
  const results = document.querySelector('#results');
  while (results.firstChild) {
    results.removeChild(results.firstChild);
  }
  const downloadAll = document.createElement('button');
  downloadAll.textContent = 'Download all';
  downloadAll.addEventListener('click', handleDownload);

  const files = input.files;
  if (files.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'No files currently selected for upload';
    preview.appendChild(para);
  } else {
    const list = document.createElement('ol');
    preview.appendChild(list);
    const resultList = document.createElement('ol');
    results.appendChild(resultList);

    const resultCanvases = [];

    let index = 0;
    for (const file of files) {
      const listItem = document.createElement('li');
      const para = document.createElement('p');
      if (validFileType(file)) {
        para.textContent = `File name ${file.name}, file size ${returnFileSize(file.size)}.`;

        const filename = file.name.replace('.', '');
        const image = document.createElement('img');
        image.id = `image-${filename}-${postfix}`;
        image.src = URL.createObjectURL(file);
        image.style.display = 'none';

        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${filename}-${postfix}`;
        const ctx = canvas.getContext('2d');

        image.onload = () => {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);

          const comparedCanvas = compareCanvases(filename, file.name);
          if (comparedCanvas) {
            if(index > 1) {
              results.prepend(downloadAll);
            }
            const button = document.createElement('button');
            button.textContent = `Download ${file.name}`;
            const buttonWrapper = document.createElement('div');
            buttonWrapper.appendChild(button);

            const resultListItem = document.createElement('li');
            const resultPara = document.createElement('p');
            resultPara.textContent = `File name ${file.name}, file size ${returnFileSize(file.size)}.`;

            resultCanvases[index] = comparedCanvas;
            resultCanvases.forEach(resultCanvas => {
              button.addEventListener('click', () => {
                downloadCanvasImage(resultCanvas);
              })
              resultListItem.appendChild(resultPara);
              resultListItem.appendChild(resultCanvas);
              resultListItem.appendChild(buttonWrapper);
              resultList.appendChild(resultListItem);
            });
          }
        }

        listItem.appendChild(para);
        listItem.appendChild(image);
        listItem.appendChild(canvas);
      } else {
        para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
        listItem.appendChild(para);
      }

      list.appendChild(listItem);
      index++;
    }
  }
}

const files1 = document.querySelector('#files1');
const preview1 = document.querySelector('#preview1');
files1.addEventListener('change', () => {
  updateImageDisplay(preview1, files1, '1');
});

const files2 = document.querySelector('#files2');
const preview2 = document.querySelector('#preview2');
files2.addEventListener('change', () => {
  updateImageDisplay(preview2, files2, '2');
});

function compareCanvases(filename, originalFileName) {
  const canvas1 = document.querySelector(`#canvas-${filename}-1`);
  const image1 = document.querySelector(`#image-${filename}-1`);

  const canvas2 = document.querySelector(`#canvas-${filename}-2`);
  const image2 = document.querySelector(`#image-${filename}-2`);

  if (canvas1 && canvas2 && image1 && image2) {
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    const imageData1 = ctx1.getImageData(0, 0, image1.width, image1.height);
    // have to use same width and height as first image to compare
    const imageData2 = ctx2.getImageData(0, 0, image1.width, image1.height);

    const comparedImageData = compareImages(imageData1, imageData2);

    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-result';
    canvas.title = originalFileName;
    canvas.width = image1.width;
    canvas.height = image1.height;
    const ctx = canvas.getContext('2d');

    ctx.putImageData(comparedImageData, 0, 0);
    return canvas;
  }
}

const downloadCanvasImage = (canvas) => {
  var link = document.createElement('a');
  link.download = canvas.title;
  link.href = canvas.toDataURL();
  link.click();
}

const handleDownload = () => {
  const resultCanvases = [...document.querySelectorAll('.canvas-result')];
  resultCanvases.forEach(downloadCanvasImage);
}

const handleTresholdChange = (e) => {
  tresholdvalue.innerText = e.target.value;
  updateImageDisplay(preview1, files1, '1');
}
treshold.addEventListener('change', handleTresholdChange)

function compareImages(firstData, secondData) {
  const { data } = firstData;
  const { data: data2 } = secondData;

  const useFirstData = data.length > data2.length;
  const resultData = useFirstData ? firstData : secondData;
  const len = useFirstData ? data.length : data2.length;

  for (let i = 0; i < len; i += 4) {
    const [r, g, b, a] = data.slice(i, i + 4);
    const [r2, g2, b2, a2] = data2.slice(i, i + 4);
    const tresholdPercent = treshold.value / 100;
    if (!isSimilar([r, g, b, a], [r2, g2, b2, a2], 255 * (tresholdPercent ?? 0.04))) {
      resultData.data[i] = 255;
      resultData.data[i + 1] = 0;
      resultData.data[i + 2] = 0;
      resultData.data[i + 3] = 255;
    }
  }
  return resultData;
}

function isSimilar(firstArray, secondArray, treshold) {
  if (firstArray.some((p, index) => Math.abs(p - secondArray[index]) > treshold)) {
    return false
  }
  return true;
}
