DESUGAR_TESTS := $(wildcard tests/desugar/*.js)

test-desugar: $(DESUGAR_TESTS:.js=.result)

%.actual: %.js
	@echo "testing $<... \c"
	@coffee desugar.coffee $< | node > $@

%.expected: %.js
	@node $? > $@

%.result: %.actual %.expected
	@diff $?
	@echo "passed"
