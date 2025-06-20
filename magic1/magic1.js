signupBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return showPopup('Please enter a name to sign up.');
  userData.name = name;
  startVideo();
};

loginBtn.onclick = () => loadInput.click();

loadInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      userData = JSON.parse(reader.result);
      startVideo();
    } catch {
      showPopup('Invalid save file format.');
    }
  };
  reader.readAsText(file);
};