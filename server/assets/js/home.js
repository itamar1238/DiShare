$('#search + button').on('click', () => {
    const query = $('#search input').val()
    // const results = new Fuse(servers, {
    //     isCaseSensitive: false,
    //     keys: [
    //         { name: 'title', weight: 1 },
    //         { name: 'inv', weight: 0.5 }
    //     ]
    // }).search(query).map(r => r.item);
    // console.log(results)
    location.href = '/search?q=' + query
})